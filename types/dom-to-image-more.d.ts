/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "dom-to-image-more" {
  type DomToImageOptions = {
    quality?: number;
    bgcolor?: string;
    width?: number;
    height?: number;
    style?: Record<string, any>;
    filter?(node: Node): boolean;
    imagePlaceholder?: string;
    cacheBust?: boolean;
  };

  interface DomToImageStatic {
    toPng(node: HTMLElement, options?: DomToImageOptions): Promise<string>;
    toJpeg(node: HTMLElement, options?: DomToImageOptions): Promise<string>;
    toSvg(node: HTMLElement, options?: DomToImageOptions): Promise<string>;
    toBlob(node: HTMLElement, options?: DomToImageOptions): Promise<Blob>;
    toCanvas(
      node: HTMLElement,
      options?: DomToImageOptions
    ): Promise<HTMLCanvasElement>;
  }

  const domtoimage: DomToImageStatic;
  export default domtoimage;
}
