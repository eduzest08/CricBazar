import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CatalogApiService } from '../../../core/services/catalog-api.service';
import { Product } from '../../../core/models/catalog.models';
import { createProductPdf, createProductWorkbook, loadProductReport, productMargin, productProfit } from './product-export';

const product: Product = {
  id: 1, name: '=Formula text', slug: 'bat', sku: 'CB-1', categoryId: 1, brandId: 2,
  mrp: 100, salePrice: 80, costPrice: 40, discountPct: 20,
  shortDesc: 'Short', description: '<p>Details</p>', stock: 5, avgRating: 4, reviewCount: 2,
  salesCount: 3, sortOrder: 1, metaTitle: 'Title', metaDesc: 'Meta', isActive: true, hasImage: true, isPublished: true,
  createdAt: '2026-01-02T03:04:05Z', updatedAt: '2026-02-03T04:05:06Z', createdBy: 'admin',
};
const png = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC'), c => c.charCodeAt(0));
const stubLogo = () => vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => png.buffer }));

describe('product exports', () => {
  const api = {
    getBrands: vi.fn(() => of([{ id: 2, name: 'Brand', slug: 'brand', logoUrl: null, isActive: true }])),
    getCategories: vi.fn(() => of([{ id: 1, name: 'Category', slug: 'category', parentId: null, sortOrder: 0, isActive: true }])),
    getProducts: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({ providers: [{ provide: CatalogApiService, useValue: api }] });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('fetches all pages of active and inactive products independent of the current list', async () => {
    const active = Array.from({ length: 100 }, (_, i) => ({ ...product, id: 200 - i }));
    api.getProducts.mockImplementation((_search, page, _size, _sort, isActive) => of(
      isActive
        ? { items: page === 1 ? active : [{ ...product, id: 100 }], totalCount: 101, pageNumber: page, pageSize: 100 }
        : { items: [{ ...product, id: 250, isActive: false }], totalCount: 1, pageNumber: 1, pageSize: 100 },
    ));
    const report = await loadProductReport(TestBed.inject(CatalogApiService));
    expect(api.getProducts).toHaveBeenCalledTimes(3);
    expect(api.getProducts).toHaveBeenCalledWith('', 2, 100, 'id_desc', true);
    expect(api.getProducts).toHaveBeenCalledWith('', 1, 100, 'id_desc', false);
    expect(report.products).toHaveLength(102);
    expect(report.products[0].id).toBe(250);
  });

  it('fails instead of downloading an incomplete or inconsistent report', async () => {
    api.getProducts.mockReturnValueOnce(of({ items: [product], totalCount: 2, pageNumber: 1, pageSize: 100 }))
      .mockReturnValueOnce(of({ items: [], totalCount: 2, pageNumber: 2, pageSize: 100 }));
    await expect(loadProductReport(TestBed.inject(CatalogApiService))).rejects.toThrow('changed while exporting');
    api.getProducts.mockReturnValueOnce(throwError(() => new Error('API unavailable')));
    await expect(loadProductReport(TestBed.inject(CatalogApiService))).rejects.toThrow('API unavailable');
  });

  it('calculates profits, losses and unavailable zero-price margins', () => {
    expect(productProfit(product)).toBe(40);
    expect(productMargin(product)).toBe(0.5);
    expect(productProfit({ ...product, salePrice: 20 })).toBe(-20);
    expect(productMargin({ ...product, salePrice: 20 })).toBe(-1);
    expect(productMargin({ ...product, salePrice: 0 })).toBeNull();
  });

  it('creates a workbook with the PDF columns, original styling and numeric pricing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Logo unavailable')));
    const blob = await createProductWorkbook({ products: [product, { ...product, id: 2, salePrice: 20 }, { ...product, id: 3, salePrice: 0 }],
      brands: [{ id: 2, name: 'Brand', slug: 'brand', logoUrl: null, isActive: true }],
      categories: [{ id: 1, name: 'Category', slug: 'category', parentId: null, sortOrder: 0, isActive: true }] });
    const { Workbook } = await import('exceljs');
    const workbook = new Workbook();
    await workbook.xlsx.load(await blob.arrayBuffer());
    const sheet = workbook.getWorksheet('Products')!;
    expect(workbook.worksheets).toHaveLength(1);
    expect(sheet.getImages()).toHaveLength(0);
    expect(sheet.getRow(1).values).toEqual([, 'No.', 'Product', 'SKU', 'Category', 'Brand', 'MRP', 'Cost', 'Sale', 'Profit / loss', 'Margin %', 'Stock', 'Status']);
    expect(sheet.getCell('A1').font.bold).toBe(true);
    expect(sheet.getCell('A1').fill).toMatchObject({ type: 'pattern', fgColor: { argb: 'FF173A35' } });
    expect(sheet.views[0]).toMatchObject({ state: 'frozen', ySplit: 1, showGridLines: false });
    expect(sheet.autoFilter).toBe('A1:L1');
    expect(sheet.getCell('B2').value).toBe('=Formula text');
    expect(sheet.getCell('D2').value).toBe('Category');
    expect(sheet.getCell('E2').value).toBe('Brand');
    expect(sheet.getCell('I2').value).toBe(40);
    expect(sheet.getCell('J2').value).toBe(0.5);
    expect(sheet.getCell('I3').value).toBe(-20);
    expect(sheet.getCell('J3').value).toBe(-1);
    expect(sheet.getCell('J4').value).toBe('N/A');
    expect(sheet.getCell('J2').numFmt).toContain('0.00%');
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it.each([0, 1, 4, 10, 11])('writes exactly %i product rows without padding', async (count) => {
    const products = Array.from({ length: count }, (_, index) => ({ ...product, id: index + 1 }));
    const blob = await createProductWorkbook({ products, brands: [], categories: [] });
    const { Workbook } = await import('exceljs');
    const workbook = new Workbook();
    await workbook.xlsx.load(await blob.arrayBuffer());
    const sheet = workbook.getWorksheet('Products')!;
    expect(sheet.rowCount).toBe(count + 1);
    expect(sheet.actualRowCount).toBe(count + 1);
    expect(sheet.getSheetValues()).toHaveLength(count + 2);
  });

  it('creates a paginated PDF containing the logo and calculated loss and margin', async () => {
    stubLogo();
    const products = Array.from({ length: 100 }, (_, i) => ({
      ...product, id: i + 1, name: `Product ${i + 1}`, salePrice: 20,
    }));
    const blob = await createProductPdf({ products, brands: [], categories: [] });
    const text = await blob.text();
    expect(text.startsWith('%PDF-')).toBe(true);
    expect(text).toContain('/Subtype /Image');
    expect(text).toContain('(Product 100)');
    expect(text).toContain('(-20.00)');
    expect(text).toContain('(-100.00%)');
    expect(text).toContain('(Page 2)');
    expect(text).toMatch(/ re\nB/);
  });

  it('reports an unavailable PDF logo instead of silently omitting it', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    await expect(createProductPdf({ products: [], brands: [], categories: [] }))
      .rejects.toThrow('report logo could not be loaded');
  });
});
