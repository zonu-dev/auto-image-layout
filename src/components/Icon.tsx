import feather from 'feather-icons'

export type IconName =
  | 'arrow-down'
  | 'arrow-right'
  | 'arrow-up'
  | 'download'
  | 'droplet'
  | 'eye'
  | 'file-text'
  | 'image'
  | 'maximize-2'
  | 'more-horizontal'
  | 'sliders'
  | 'trash-2'
  | 'upload'

type IconProps = {
  className?: string
  name: IconName
  size?: number
  strokeWidth?: number
}

function Icon({ className, name, size = 18, strokeWidth = 2 }: IconProps) {
  const icon = feather.icons[name]

  return (
    <span
      aria-hidden="true"
      className={className ? `icon ${className}` : 'icon'}
      dangerouslySetInnerHTML={{
        __html: icon.toSvg({
          class: 'icon-svg',
          height: size,
          'stroke-width': strokeWidth,
          width: size,
        }),
      }}
    />
  )
}

export default Icon
