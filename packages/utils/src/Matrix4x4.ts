import { IVector3D } from '@octane/api';
import { Vector3d } from './Vector3d';

export class Matrix4x4
{
    public static IDENTITY:Matrix4x4 = new Matrix4x4(1, 0, 0, 0, 1, 0, 0, 0, 1);
    private static TOLERANS: number = 1E-18;

    private _data: number[];

    constructor(m00: number = 0, m01: number = 0, m02: number = 0, m10: number = 0, m11: number = 0, m12: number = 0, m20: number = 0, m21: number = 0, m22: number = 0)
    {
        this._data = [m00, m01, m02, m10, m11, m12, m20, m21, m22];
    }

    public static getXRotationMatrix(degrees: number): Matrix4x4
    {
        const radians = ((degrees * Math.PI) / 180);
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);

        return new Matrix4x4(1, 0, 0, 0, cos, -(sin), 0, sin, cos);
    }

    public static getYRotationMatrix(degrees: number): Matrix4x4
    {
        const radians = ((degrees * Math.PI) / 180);
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);

        return new Matrix4x4(cos, 0, sin, 0, 1, 0, -(sin), 0, cos);
    }

    public static getZRotationMatrix(degrees: number): Matrix4x4
    {
        const radians = ((degrees * Math.PI) / 180);
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);

        return new Matrix4x4(cos, -(sin), 0, sin, cos, 0, 0, 0, 1);
    }

    public identity(): Matrix4x4
    {
        this._data = [1, 0, 0, 0, 1, 0, 0, 0, 1];

        return this;
    }

    public vectorMultiplication(vector: IVector3D): IVector3D
    {
        const x = (((vector.x * this._data[0]) + (vector.y * this._data[3])) + (vector.z * this._data[6]));
        const y = (((vector.x * this._data[1]) + (vector.y * this._data[4])) + (vector.z * this._data[7]));
        const z = (((vector.x * this._data[2]) + (vector.y * this._data[5])) + (vector.z * this._data[8]));

        return new Vector3d(x, y, z);
    }

    public multiply(matrix:Matrix4x4): Matrix4x4
    {
        const m00 = (((this._data[0] * matrix.data[0]) + (this._data[1] * matrix.data[3])) + (this._data[2] * matrix.data[6]));
        const m01 = (((this._data[0] * matrix.data[1]) + (this._data[1] * matrix.data[4])) + (this._data[2] * matrix.data[7]));
        const m02 = (((this._data[0] * matrix.data[2]) + (this._data[1] * matrix.data[5])) + (this._data[2] * matrix.data[8]));
        const m10 = (((this._data[3] * matrix.data[0]) + (this._data[4] * matrix.data[3])) + (this._data[5] * matrix.data[6]));
        const m11 = (((this._data[3] * matrix.data[1]) + (this._data[4] * matrix.data[4])) + (this._data[5] * matrix.data[7]));
        const m12 = (((this._data[3] * matrix.data[2]) + (this._data[4] * matrix.data[5])) + (this._data[5] * matrix.data[8]));
        const m20 = (((this._data[6] * matrix.data[0]) + (this._data[7] * matrix.data[3])) + (this._data[8] * matrix.data[6]));
        const m21 = (((this._data[6] * matrix.data[1]) + (this._data[7] * matrix.data[4])) + (this._data[8] * matrix.data[7]));
        const m22 = (((this._data[6] * matrix.data[2]) + (this._data[7] * matrix.data[5])) + (this._data[8] * matrix.data[8]));

        return new Matrix4x4(m00, m01, m02, m10, m11, m12, m20, m21, m22);
    }

    public scalarMultiply(factor: number): void
    {
        let index = 0;

        while(index < this._data.length)
        {
            this._data[index] = (this._data[index] * factor);

            index++;
        }
    }

    public rotateX(degrees: number): Matrix4x4
    {
        const radians = ((degrees * Math.PI) / 180);
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        const rotationMatrix = new Matrix4x4(1, 0, 0, 0, cos, -(sin), 0, sin, cos);

        return rotationMatrix.multiply(this);
    }

    public rotateY(degrees: number): Matrix4x4
    {
        const radians = ((degrees * Math.PI) / 180);
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        const rotationMatrix = new Matrix4x4(cos, 0, sin, 0, 1, 0, -(sin), 0, cos);

        return rotationMatrix.multiply(this);
    }

    public rotateZ(degrees: number): Matrix4x4
    {
        const radians = ((degrees * Math.PI) / 180);
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        const rotationMatrix = new Matrix4x4(cos, -(sin), 0, sin, cos, 0, 0, 0, 1);

        return rotationMatrix.multiply(this);
    }

    public skew(): void
    {
    }

    public transpose(): Matrix4x4
    {
        return new Matrix4x4(this._data[0], this._data[3], this._data[6], this._data[1], this._data[4], this._data[7], this._data[2], this._data[5], this._data[8]);
    }

    public equals(matrix: Matrix4x4): boolean
    {
        return false;
    }

    public get data(): number[]
    {
        return this._data;
    }
}
