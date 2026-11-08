import { firstValueFrom } from 'rxjs';
import { Brand, Category, Product, productStatus } from '../../../core/models/catalog.models';
import { CatalogApiService } from '../../../core/services/catalog-api.service';

export interface ProductReport {
  products: Product[];
  brands: Brand[];
  categories: Category[];
}

export async function loadProductReport(api: CatalogApiService): Promise<ProductReport> {
  const [brands, categoryTree] = await Promise.all([
    firstValueFrom(api.getBrands()),
    firstValueFrom(api.getCategories()),
  ]);
  const categories: Category[] = [];
  const collectCategories = (items: Category[]) => {
    for (const category of items) {
      categories.push(category);
      collectCategories(category.children ?? []);
    }
  };
  collectCategories(categoryTree);

  const products: Product[] = [];
  const ids = new Set<number>();
  for (const active of [true, false]) {
    let pageNumber = 1;
    let totalCount: number | undefined;
    let loaded = 0;
    do {
      const page = await firstValueFrom(api.getProducts('', pageNumber, 100, 'id_desc', active));
      if (totalCount === undefined) totalCount = page.totalCount;
      if (page.totalCount !== totalCount || page.pageNumber !== pageNumber ||
          (page.items.length === 0 && loaded < totalCount)) {
        throw new Error('The product catalog changed while exporting. Please try again.');
      }
      for (const product of page.items) {
        if (ids.has(product.id) || product.isActive !== active) {
          throw new Error('The product catalog changed while exporting. Please try again.');
        }
        ids.add(product.id);
        products.push(product);
      }
      loaded += page.items.length;
      pageNumber++;
    } while (loaded < totalCount);
    if (loaded !== totalCount) {
      throw new Error('The product catalog changed while exporting. Please try again.');
    }
  }
  products.sort((a, b) => b.id - a.id);
  return { products, brands, categories };
}

export function productProfit(product: Product): number | null {
  return Number.isFinite(product.salePrice) && Number.isFinite(product.costPrice)
    ? Math.round((product.salePrice - product.costPrice) * 100) / 100 : null;
}

export function productMargin(product: Product): number | null {
  const profit = productProfit(product);
  return profit !== null && product.salePrice > 0 ? profit / product.salePrice : null;
}

function names(report: ProductReport): { brands: Map<number, string>; categories: Map<number, string> } {
  return {
    brands: new Map(report.brands.map((brand) => [brand.id, brand.name])),
    categories: new Map(report.categories.map((category) => [category.id, category.name])),
  };
}

async function loadReportLogo(): Promise<Uint8Array> {
  const response = await fetch(new URL('product-report-logo.png', document.baseURI));
  if (!response.ok) throw new Error('The report logo could not be loaded. Please try again.');
  return new Uint8Array(await response.arrayBuffer());
}

export async function createProductWorkbook(report: ProductReport): Promise<Blob> {
  const { Workbook } = await import('exceljs');
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet('Products', { views: [{ state: 'frozen', ySplit: 1, showGridLines: false }] });
  sheet.columns = [
    { header: 'No.', key: 'id', width: 14 },
    { header: 'Product', key: 'name', width: 30 },
    { header: 'SKU', key: 'sku', width: 22 },
    { header: 'Category', key: 'category', width: 22 },
    { header: 'Brand', key: 'brand', width: 22 },
    { header: 'MRP', key: 'mrp', width: 14 },
    { header: 'Cost', key: 'costPrice', width: 14 },
    { header: 'Sale', key: 'salePrice', width: 14 },
    { header: 'Profit / loss', key: 'profit', width: 22 },
    { header: 'Margin %', key: 'margin', width: 18 },
    { header: 'Stock', key: 'stock', width: 12 },
    { header: 'Status', key: 'status', width: 14 },
  ];
  const lookup = names(report);
  for (const product of report.products) {
    sheet.addRow({
      ...product,
      brand: lookup.brands.get(product.brandId) ?? `#${product.brandId}`,
      category: lookup.categories.get(product.categoryId) ?? `#${product.categoryId}`,
      status: productStatus(product),
      profit: productProfit(product),
      margin: productMargin(product) ?? 'N/A',
    });
  }
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF173A35' } };
  sheet.autoFilter = { from: 'A1', to: 'L1' };
  for (const key of ['mrp', 'costPrice', 'salePrice', 'profit']) sheet.getColumn(key).numFmt = '#,##0.00;[Red]-#,##0.00';
  sheet.getColumn('margin').numFmt = '0.00%;[Red]-0.00%';
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export async function createProductPdf(report: ProductReport): Promise<Blob> {
  const [{ jsPDF }, { default: autoTable }, logo] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    loadReportLogo(),
  ]);
  const doc = new jsPDF({ orientation: 'landscape', format: 'a3' });
  const lookup = names(report);
  const money = (value: number | null) => value === null || !Number.isFinite(value) ? 'N/A' : value.toFixed(2);
  autoTable(doc, {
    startY: 34,
    margin: { top: 34, right: 12, bottom: 17, left: 12 },
    head: [['No.', 'Product', 'SKU', 'Category', 'Brand', 'MRP', 'Cost', 'Sale', 'Profit / loss', 'Margin %', 'Stock', 'Status']],
    body: report.products.map((product) => {
      const margin = productMargin(product);
      return [
        String(product.id), product.name, product.sku,
        lookup.categories.get(product.categoryId) ?? `#${product.categoryId}`,
        lookup.brands.get(product.brandId) ?? `#${product.brandId}`,
        money(product.mrp), money(product.costPrice), money(product.salePrice),
        money(productProfit(product)), margin === null ? 'N/A' : `${(margin * 100).toFixed(2)}%`,
        String(product.stock), productStatus(product),
      ];
    }),
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak', lineWidth: 0.2, lineColor: [185, 201, 192] },
    headStyles: { fillColor: [23, 58, 53], lineWidth: 0.2, lineColor: [185, 201, 192] },
    alternateRowStyles: { fillColor: [245, 248, 246] },
    columnStyles: {
      0: { cellWidth: 17 }, 5: { halign: 'right' }, 6: { halign: 'right' },
      7: { halign: 'right' }, 8: { halign: 'right' }, 9: { halign: 'right' },
      10: { halign: 'right' },
    },
    didDrawPage: (data) => {
      doc.addImage(logo, 'PNG', 12, 4, 38, 21, undefined, 'FAST');
      doc.setFontSize(15);
      doc.text('Product pricing and profit / loss report', 55, 14);
      doc.setFontSize(8);
      doc.text('Profit / loss = sale price - cost price per item. Negative values are losses. Margin = profit / loss divided by sale price.', 55, 21);
      doc.text(`Page ${data.pageNumber}`, doc.internal.pageSize.getWidth() - 12, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
    },
  });
  return doc.output('blob');
}

export function downloadReport(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
