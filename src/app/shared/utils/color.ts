export class ColorUtil {
  private static colorMeterial = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
  public static generateColorArray(numOfColor: number): string[] {
    let colorArray: string[] = [];

    while (colorArray.length < numOfColor) {
      const color = ColorUtil.genterateAColor();
      if (colorArray.indexOf(color) === -1) {
        colorArray.push(color); // Be unique
      }
    }
    if (localStorage.getItem('color')) {
      colorArray = localStorage.getItem('color').split(',');
    }
    localStorage.setItem('color', colorArray.toString());
    return colorArray;
  }

  public static genterateAColor(): string {
    let color = '#';
    for (let i = 0; i < 6; i++) {
      const index = Math.floor(Math.random() * 99999) % 16;
      color += ColorUtil.colorMeterial[index];
    }
    return color;
  }

  /***
   * Converting color hex to rgb
   * @param h : is #000 or #000000
   */
  public static hexToRgb(h: string): string {
    let r = '0';
    let g = '0';
    let b = '0';
    if (h.length === 4) {
      r = '0x' + h[1] + h[1];
      g = '0x' + h[2] + h[2];
      b = '0x' + h[3] + h[3];

    } else if (h.length === 7) {
      r = '0x' + h[1] + h[2];
      g = '0x' + h[3] + h[4];
      b = '0x' + h[5] + h[6];
    }
    return 'rgb(' + (+r + ',' + +g + ',' + +b) + ')';
  }

  /***
   * Converting color rgb to hex
   * @param h : is rgb(r,g,b)
   */
  public static RGBToHex(rgb: string): string {
    const rgbArr = rgb.toLowerCase()
      .replace(/\w*/, '')
      .replace('(', '')
      .replace(')', '')
      .split(',');
    // tslint:disable-next-line:no-bitwise
    return '#' + ((1 << 24) + (+rgbArr[0] << 16) + (+rgbArr[1] << 8) + +rgbArr[2]).toString(16).slice(1);
    // if (('' + r).length === 1) {
    //   r = '0' + r;
    // }
    // if (g.length === 1) {
    //   g = '0' + g;
    // }
    // if (b.length === 1) {
    //   b = '0' + b;
    // }
    //
    // return '#' + r + g + b;
  }
}
