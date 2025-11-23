declare module "youtubei.js" {
  export class Innertube {
    static create(config?: any): Promise<Innertube>;
    getInfo(videoId: string): Promise<any>;
  }
}
