declare module 'feather-icons' {
  type FeatherIconAttributes = Record<string, string | number>

  type FeatherIcon = {
    attrs: Record<string, string>
    contents: string
    name: string
    tags: string[]
    toSvg: (attributes?: FeatherIconAttributes) => string
  }

  const feather: {
    icons: Record<string, FeatherIcon>
  }

  export default feather
}
