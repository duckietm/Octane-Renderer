import { IVector3D } from '@octane/api';
import { Vector3d } from './Vector3d';

export class ColorConverter
{
    private static HEX_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];

    public static hex2rgb(hex: number, out: Array<number> | Float32Array = []): Array<number> | Float32Array
    {
        out[0] = ((hex >> 16) & 0xFF) / 255;
        out[1] = ((hex >> 8) & 0xFF) / 255;
        out[2] = (hex & 0xFF) / 255;

        return out;
    }

    public static hex2rgba(hex: number, out: Array<number> | Float32Array = []): Array<number> | Float32Array
    {
        out[0] = ((hex >> 16) & 0xFF) / 255;
        out[1] = ((hex >> 8) & 0xFF) / 255;
        out[2] = (hex & 0xFF) / 255;
        out[3] = (hex & 0xFF);

        return out;
    }

    public static rgb2hex(rgb: number[] | Float32Array): number
    {
        return (((rgb[0] * 255) << 16) + ((rgb[1] * 255) << 8) + (rgb[2] * 255 | 0));
    }

    public static rgba2hex(rgb: number[] | Float32Array): number
    {
        return (((rgb[0] * 255) << 16) + ((rgb[1] * 255) << 8) + (rgb[2] * 255 | 0) + (rgb[3] | 0));
    }

    public static rgbStringToHex(rgb: string): string
    {
        const extracted = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);

        return '#' + ColorConverter.getHex(extracted[1]) + ColorConverter.getHex(extracted[2]) + ColorConverter.getHex(extracted[3]);
    }

    public static getHex(x: any)
    {
        return isNaN(x) ? '00' : ColorConverter.HEX_DIGITS[(x - x % 16) / 16] + ColorConverter.HEX_DIGITS[x % 16];
    }

    public static int2rgb(color: number): string
    {
        color >>>= 0;
        const b = color & 0xFF;
        const g = (color & 0xFF00) >>> 8;
        const r = (color & 0xFF0000) >>> 16;
        const a = ((color & 0xFF000000) >>> 24) / 255;

        return 'rgba(' + [r, g, b, 1].join(',') + ')';
    }

    public static rgbToHSL(rgbValue: number): number
    {
        const red = ((rgbValue >> 16) & 0xFF) / 0xFF;
        const green = ((rgbValue >> 8) & 0xFF) / 0xFF;
        const blue = (rgbValue & 0xFF) / 0xFF;

        const max = Math.max(red, green, blue);
        const min = Math.min(red, green, blue);
        const delta = max - min;

        let hue = 0;
        let saturation = 0;
        const lightness = (max + min) / 2;

        if(delta !== 0)
        {
            saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

            switch(max)
            {
                case red:
                    hue = (green - blue) / delta + (green < blue ? 6 : 0);
                    break;
                case green:
                    hue = (blue - red) / delta + 2;
                    break;
                case blue:
                    hue = (red - green) / delta + 4;
                    break;
            }

            hue *= 60;
        }

        const h = Math.round((hue / 360) * 0xFF);
        const s = Math.round(saturation * 0xFF);
        const l = Math.round(lightness * 0xFF);

        return (h << 16) + (s << 8) + l;
    }

    public static hslToRGB(hslValue: number): number
    {
        const hue = ((hslValue >> 16) & 0xFF) / 0xFF;
        const saturation = ((hslValue >> 8) & 0xFF) / 0xFF;
        const lightness = (hslValue & 0xFF) / 0xFF;

        let red = 0;
        let green = 0;
        let blue = 0;

        if(saturation > 0)
        {
            const t2 = lightness < 0.5 ? lightness * (1 + saturation) : (lightness + saturation) - (lightness * saturation);
            const t1 = (2 * lightness) - t2;

            const rgb = [hue + (1 / 3), hue, hue - (1 / 3)].map(color =>
            {
                if(color < 0) color += 1;
                if(color > 1) color -= 1;
                if(color * 6 < 1) return t1 + ((t2 - t1) * 6 * color);
                if(color * 2 < 1) return t2;
                if(color * 3 < 2) return t1 + ((t2 - t1) * ((2 / 3) - color) * 6);
                return t1;
            });

            [red, green, blue] = rgb;
        }
        else
        {
            red = green = blue = lightness; // In the case of no saturation, all colors are the same.
        }

        const r = Math.round(red * 0xFF);
        const g = Math.round(green * 0xFF);
        const b = Math.round(blue * 0xFF);

        return (r << 16) + (g << 8) + b;
    }

    public static rgb2xyz(rgb: number): IVector3D
    {
        let red: number = (((rgb >> 16) & 0xFF) / 0xFF);
        let green: number = (((rgb >> 8) & 0xFF) / 0xFF);
        let blue: number = (((rgb >> 0) & 0xFF) / 0xFF);
        if(red > 0.04045)
        {
            red = Math.pow(((red + 0.055) / 1.055), 2.4);
        }
        else
        {
            red = (red / 12.92);
        }
        if(green > 0.04045)
        {
            green = Math.pow(((green + 0.055) / 1.055), 2.4);
        }
        else
        {
            green = (green / 12.92);
        }
        if(blue > 0.04045)
        {
            blue = Math.pow(((blue + 0.055) / 1.055), 2.4);
        }
        else
        {
            blue = (blue / 12.92);
        }
        red = (red * 100);
        green = (green * 100);
        blue = (blue * 100);
        return new Vector3d((((red * 0.4124) + (green * 0.3576)) + (blue * 0.1805)), (((red * 0.2126) + (green * 0.7152)) + (blue * 0.0722)), (((red * 0.0193) + (green * 0.1192)) + (blue * 0.9505)));
    }

    public static xyz2CieLab(xyz: IVector3D): IVector3D
    {
        let x: number = (xyz.x / 95.047);
        let y: number = (xyz.y / 100);
        let z: number = (xyz.z / 108.883);
        if(x > 0.008856)
        {
            x = Math.pow(x, (1 / 3));
        }
        else
        {
            x = ((7.787 * x) + (16 / 116));
        }
        if(y > 0.008856)
        {
            y = Math.pow(y, (1 / 3));
        }
        else
        {
            y = ((7.787 * y) + (16 / 116));
        }
        if(z > 0.008856)
        {
            z = Math.pow(z, (1 / 3));
        }
        else
        {
            z = ((7.787 * z) + (16 / 116));
        }
        return new Vector3d(((116 * y) - 16), (500 * (x - y)), (200 * (y - z)));
    }

    public static rgb2CieLab(rgb: number): IVector3D
    {
        return ColorConverter.xyz2CieLab(ColorConverter.rgb2xyz(rgb));
    }

    public static colorize(colorA: number, colorB: number): number
    {
        if(colorB === 0xFFFFFFFF) return colorA;

        let r = ((colorB >> 16) & 0xFF);
        let g = ((colorB >> 8) & 0xFF);
        let b = (colorB & 0xFF);

        r = ((((colorA >> 16) & 0xFF) * r) / 0xFF);
        g = ((((colorA >> 8) & 0xFF) * g) / 0xFF);
        b = (((colorA & 0xFF) * b) / 0xFF);

        return ((colorA && 0xFF000000) | (r << 16) | (g << 8) | b);
    }
}
