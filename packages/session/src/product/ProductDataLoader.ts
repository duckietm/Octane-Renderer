import { IProductData } from '@octane/api';
import { GetConfiguration } from '@octane/configuration';
import { loadGamedata } from '@octane/utils';
import { ProductData } from './ProductData';

export class ProductDataLoader
{
    private _products: Map<string, IProductData>;

    constructor(products: Map<string, IProductData>)
    {
        this._products = products;
    }

    public async init(): Promise<void>
    {
        const url = GetConfiguration().getValue<string>('productdata.url');

        if(!url || !url.length) throw new Error('Missing "productdata.url" in config — add the product data URL to your renderer-config.json');

        let responseData: any;

        try
        {
            responseData = await loadGamedata(url);
        }
        catch (err)
        {
            throw new Error(`Could not load product data from "${ url }" — check "productdata.url" in renderer-config.json (${ err?.message || err })`);
        }

        this.parseProducts(responseData.productdata);
    }

    private parseProducts(data: { [index: string]: any }): void
    {
        if(!data) return;

        for(const product of data.product) (product && this._products.set(product.code, new ProductData(product.code, product.name, product.description)));
    }
}
