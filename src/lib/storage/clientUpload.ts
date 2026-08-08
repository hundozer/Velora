export interface UploadProgressCallback {
  (progressPercent: number): void;
}

export interface DirectUploadResult {
  publicUrl: string;
  objectKey: string;
  mediaId: string;
  isMock: boolean;
}

export interface ParticipantDeclaration {
  containsOtherIdentifiableParticipants: boolean;
  allParticipantsAdults: boolean;
  recordingConsented: boolean;
  publicationConsented: boolean;
}

export function requestParticipantDeclaration(): Promise<ParticipantDeclaration> {
  return new Promise((resolve, reject) => {
    const dialog = document.createElement("dialog");
    dialog.setAttribute("aria-labelledby", "participant-declaration-title");
    dialog.setAttribute("aria-describedby", "participant-declaration-description");
    Object.assign(dialog.style, {
      maxWidth: "520px", width: "calc(100% - 32px)", border: "1px solid rgba(214,173,60,.55)",
      borderRadius: "20px", padding: "0", background: "#111722", color: "#f7f8fb",
      boxShadow: "0 24px 80px rgba(0,0,0,.72)", fontFamily: "inherit", overflow: "hidden",
    });
    dialog.innerHTML = `
      <div style="padding:28px">
        <p style="margin:0 0 8px;color:#e8be4b;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase">Participant declaration</p>
        <h2 id="participant-declaration-title" style="margin:0 0 10px;font-size:24px;line-height:1.25">Who can be identified in this media?</h2>
        <p id="participant-declaration-description" style="margin:0 0 22px;color:#c3cad7;line-height:1.55">Select the statement that is true. Intimo records this declaration to protect everyone shown.</p>
        <div data-step="people" style="display:grid;gap:12px">
          <button value="only-me" style="min-height:52px;padding:14px 16px;border:1px solid rgba(255,255,255,.16);border-radius:12px;background:#171e2b;color:#f7f8fb;text-align:left;font:inherit;font-weight:750;cursor:pointer">Only I am identifiable</button>
          <button value="others" style="min-height:52px;padding:14px 16px;border:1px solid rgba(255,255,255,.16);border-radius:12px;background:#171e2b;color:#f7f8fb;text-align:left;font:inherit;font-weight:750;cursor:pointer">Other identifiable adults are visible</button>
          <button value="cancel" style="min-height:44px;padding:10px;border:0;background:transparent;color:#c3cad7;font:inherit;font-weight:650;cursor:pointer">Cancel and do not upload</button>
        </div>
        <div data-step="consent" hidden>
          <div style="padding:16px;border:1px solid rgba(214,173,60,.35);border-radius:12px;background:rgba(214,173,60,.08)">
            <p data-consent-copy style="margin:0;color:#e7eaf0;line-height:1.55"></p>
          </div>
          <div style="display:grid;gap:10px;margin-top:18px">
            <button value="confirm" style="min-height:52px;padding:14px;border:0;border-radius:12px;background:#d6ad3c;color:#111722;font:inherit;font-weight:850;cursor:pointer">Confirm declaration and upload</button>
            <button value="back" style="min-height:44px;padding:10px;border:1px solid rgba(255,255,255,.16);border-radius:12px;background:#171e2b;color:#f7f8fb;font:inherit;font-weight:700;cursor:pointer">Change participant selection</button>
            <button value="cancel" style="min-height:44px;padding:10px;border:0;background:transparent;color:#c3cad7;font:inherit;font-weight:650;cursor:pointer">Cancel and do not upload</button>
          </div>
        </div>
      </div>`;

    let containsOthers = false;
    const peopleStep = dialog.querySelector<HTMLElement>('[data-step="people"]')!;
    const consentStep = dialog.querySelector<HTMLElement>('[data-step="consent"]')!;
    const consentCopy = dialog.querySelector<HTMLElement>("[data-consent-copy]")!;
    consentStep.style.display = "none";
    const finish = (error?: Error) => {
      dialog.close();
      dialog.remove();
      if (error) reject(error);
    };

    dialog.addEventListener("click", (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button");
      if (!button) return;
      if (button.value === "cancel") return finish(new Error("Upload cancelled"));
      if (button.value === "back") {
        consentStep.style.display = "none";
        peopleStep.style.display = "grid";
        return;
      }
      if (button.value === "only-me" || button.value === "others") {
        containsOthers = button.value === "others";
        consentCopy.textContent = containsOthers
          ? "I confirm that every identifiable person is 18 or older and consented to both the recording and publication of this media on Intimo."
          : "I confirm that I am 18 or older and consent to Intimo storing and showing this media according to the visibility I select.";
        peopleStep.style.display = "none";
        consentStep.style.display = "block";
        return;
      }
      if (button.value === "confirm") {
        resolve({ containsOtherIdentifiableParticipants: containsOthers, allParticipantsAdults: true, recordingConsented: true, publicationConsented: true });
        finish();
      }
    });
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      finish(new Error("Upload cancelled"));
    });
    document.body.appendChild(dialog);
    dialog.showModal();
  });
}

/**
 * Client-side helper function that uploads a File directly to Cloudflare R2 storage.
 * Bypasses Vercel payload limits by performing a direct PUT request to the R2 presigned URL.
 */
export async function uploadFileToR2(
  file: File,
  folder: "photos" | "videos" | "avatars" | "covers" | "general" = "general",
  onProgress?: UploadProgressCallback,
  participantDeclaration?: ParticipantDeclaration,
  visibility?: "PUBLIC" | "MEMBERS_ONLY" | "FOLLOWERS_ONLY" | "PRIVATE" | "APPROVED_USERS_ONLY"
): Promise<DirectUploadResult> {
  if (!participantDeclaration) throw new Error("Participant declaration is required before upload");
  // 1. Request presigned upload URL from API
  const response = await fetch("/api/media/presign-upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type || "application/octet-stream",
      fileSize: file.size,
      folder,
      visibility: visibility || (folder === "avatars" || folder === "covers" ? "PUBLIC" : "PRIVATE"),
      participantDeclaration,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error || `Upload initiation failed (${response.status})`);
  }

  const { uploadUrl, publicUrl, objectKey, mediaId, isMock } = await response.json();

  // 2. Handle Mock mode (Development without R2 credentials)
  if (isMock) {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 25;
        if (onProgress) onProgress(Math.min(100, progress));

        if (progress >= 100) {
          clearInterval(interval);
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              publicUrl: (reader.result as string) || publicUrl,
              objectKey,
              mediaId,
              isMock: true,
            });
          };
          reader.readAsDataURL(file);
        }
      }, 100);
    });
  }

  // 3. Perform Direct PUT to Cloudflare R2 via XMLHttpRequest for upload progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        fetch(`/api/media/${encodeURIComponent(mediaId)}/complete`, { method: "POST" })
          .then(async (finalizeResponse) => {
            if (!finalizeResponse.ok) throw new Error((await finalizeResponse.json().catch(() => ({})))?.error || "Upload verification failed");
            resolve({ publicUrl, objectKey, mediaId, isMock: false });
          })
          .catch(reject);
      } else {
        reject(new Error(`Cloudflare R2 Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during direct Cloudflare R2 upload"));
    };

    xhr.send(file);
  });
}
