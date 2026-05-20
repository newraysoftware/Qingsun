import type { TrainingContent } from '../../types'
import { getPreviewKind } from '../../utils/previewKind'
import { DocumentPreview } from './DocumentPreview'
import { VideoPreview } from './VideoPreview'
import { Animation3DPreview } from './Animation3DPreview'
import { VrPreview } from './VrPreview'

interface ContentPreviewProps {
  content: TrainingContent
}

export function ContentPreview({ content }: ContentPreviewProps) {
  const kind = getPreviewKind(content)

  switch (kind) {
    case 'document':
      return <DocumentPreview content={content} />
    case 'video':
      return <VideoPreview content={content} />
    case 'animation3d':
      return <Animation3DPreview content={content} />
    case 'vr':
      return <VrPreview content={content} />
    case 'text':
    default:
      return <DocumentPreview content={content} />
  }
}
