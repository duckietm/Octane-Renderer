import { IGraphicAsset } from '@octane/api';

export interface ParticleSystemParticle
{
    isEmitter?: boolean;
    lifeTime?: number;
    fade?: boolean;
    frames?: IGraphicAsset[];
}
