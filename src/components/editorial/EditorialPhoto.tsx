import Image from "next/image";
import { editorialPhotos, type EditorialPhotoId } from "@/lib/editorialPhotos";

/** Static atmosphere only: these images never represent member profiles or events. */
export function EditorialPhoto({ photo, caption, sizes = "(min-width: 1024px) 560px, 100vw" }: {
  photo: EditorialPhotoId;
  caption: string;
  sizes?: string;
}) {
  const image = editorialPhotos[photo];
  return (
    <figure className="min-w-0 overflow-hidden rounded-2xl border border-velora-line bg-velora-surface">
      <Image
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes={sizes}
        className="aspect-[3/2] h-auto w-full object-cover"
      />
      <figcaption className="space-y-1 px-4 py-3">
        <p className="text-sm font-semibold text-velora-ink">{caption}</p>
        <p className="text-xs text-velora-muted">AI-generated illustration. Not real members or events.</p>
      </figcaption>
    </figure>
  );
}
