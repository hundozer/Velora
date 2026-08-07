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

export function requestParticipantDeclaration(): ParticipantDeclaration {
  const containsOthers = window.confirm("Does this upload show any other identifiable person besides you? Select OK for yes or Cancel for no.");
  const accepted = window.confirm(
    containsOthers
      ? "Confirm that every identifiable participant is 18 or older and consented to both recording and publication on Intimo."
      : "Confirm that you are 18 or older and consent to this upload being stored and published according to the visibility you choose."
  );
  if (!accepted) throw new Error("Upload cancelled: participant declaration was not accepted");
  return { containsOtherIdentifiableParticipants: containsOthers, allParticipantsAdults: true, recordingConsented: true, publicationConsented: true };
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
