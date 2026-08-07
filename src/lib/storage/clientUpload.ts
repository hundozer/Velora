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
    Object.assign(dialog.style, {
      maxWidth: "560px", width: "calc(100% - 32px)", border: "1px solid #d6ad3c",
      borderRadius: "16px", padding: "24px", background: "#111722", color: "#f7f8fb",
      boxShadow: "0 24px 80px rgba(0,0,0,.65)", fontFamily: "inherit",
    });
    dialog.innerHTML = `
      <h2 id="participant-declaration-title" style="margin:0 0 12px;font-size:24px">Who is visible in this upload?</h2>
      <p style="margin:0 0 20px;color:#c3cad7;line-height:1.5">Choose one option. This is required to protect everyone shown in uploaded media.</p>
      <div data-step="people" style="display:grid;gap:12px">
        <button value="only-me" style="padding:14px;text-align:left;font-weight:700">Only me is identifiable</button>
        <button value="others" style="padding:14px;text-align:left;font-weight:700">Other identifiable people are visible</button>
        <button value="cancel" style="padding:12px">Cancel upload</button>
      </div>
      <div data-step="consent" hidden>
        <p data-consent-copy style="color:#c3cad7;line-height:1.5"></p>
        <div style="display:grid;gap:12px">
          <button value="confirm" style="padding:14px;font-weight:700;background:#d6ad3c;color:#111722">I confirm and continue uploading</button>
          <button value="back" style="padding:12px">Go back and change my answer</button>
          <button value="cancel" style="padding:12px">Cancel upload</button>
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
          ? "I confirm that every identifiable participant is 18 or older and consented to both the recording and its publication on Intimo."
          : "I confirm that I am 18 or older and consent to this upload being stored and shown according to the visibility I choose.";
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
  participantDeclaration?: ParticipantDeclaration
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
      visibility: folder === "avatars" || folder === "covers" ? "PUBLIC" : "PRIVATE",
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
