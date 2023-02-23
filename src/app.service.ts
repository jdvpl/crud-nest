import { Injectable } from '@nestjs/common';
import { join } from 'path';
import PDFDocumentWithTables from 'pdfkit-table';
import * as fs from 'fs';

const city = "Bogota"
const date = "19 de septiembre de 2023"
const fullName = "LEIDI PAOLA VALVUENA MARTINEZ";
const ccDocumentNumberCity = "Cédula de Ciudadanía 80.987.875 de Bogotá";
const maxAmount = '$67.986.824 pesos';
const termFinance = '24 meses';
const amotizationype = "Cuota fija en pesos"
@Injectable()
export class AppService {
  async generatePDF(): Promise<Buffer> {
    const pdfBuffer: Buffer = await new Promise(resolve => {
      const doc = new PDFDocumentWithTables(
        {
          size: 'LETTER',
          bufferPages: true,
          autoFirstPage: false,

        }
      );
      const fontRobotoRLightPath = join(process.cwd(), "assets/fonts/Roboto-Light.ttf");
      const fontRobotoMediumPath = join(process.cwd(), "assets/fonts/Roboto-Medium.ttf");
      const fontLight = fs.readFileSync(fontRobotoRLightPath);

      const fontMedium = fs.readFileSync(fontRobotoMediumPath);
      doc.font(fontLight);
      doc.on('pageAdded', () => {
        doc.image(join(process.cwd(), "assets/images/logo.png"), 0, 0, { width: 630, height: 150 })
      })

      doc.addPage();

      doc.fontSize(10);

      doc.text(`${city}, ${date}`, 70, 150);
      doc.moveDown(2).fontSize(12).text("Señores (es)");
      doc.moveDown(1.1).font(fontMedium).fontSize(13).text(fullName);
      doc.fontSize(13).moveDown(0.5).font(fontLight).text(ccDocumentNumberCity);
      doc.moveDown().fontSize(10).font(fontMedium)
        .text("Ref: ", 70, 280).font(fontLight).text('Respuesta a solicitud financiación de vivienda', 92, 280);

      doc.text('', 70)
      doc.moveDown(1.3).fontSize(10).text('Apreciado señor (a), reciba un cordial saludo. Para el Banco Caja Social es grato comunicarle que su crédito hipotecario ha sido preaprobado con las siguientes características:', { width: doc.page.width - 160 })

      const calendar = join(process.cwd(), "assets/images/Calendar.png");
      doc.roundedRect(80, 350, 210, 55, 5)
        .fill('#F3F4F6').fillColor('#0000').image(calendar, 90, 368, { width: 16, height: 16 }).text('Monto máximo', 115, 365).fontSize(15).font(fontMedium).
        text(maxAmount, 115, 379);

      doc.roundedRect(300, 350, 210, 55, 5)
        .fill('#F3F4F6').fillColor('#0000').image(calendar, 312, 368, { width: 16, height: 16 }).font(fontLight).fontSize(9).text('Plazo', 335, 365).fontSize(15).font(fontMedium).
        text(termFinance, 335, 379);
      // mandale image
      const mandalaImage = join(process.cwd(), "assets/images/mandala.png");
      doc.image(mandalaImage, 515, 320, { width: 110, height: 250 })
      const charts = join(process.cwd(), "assets/images/Charts.png");

      doc.roundedRect(80, 415, 210, 55, 5)
        .fill('#F3F4F6').fillColor('#0000').image(charts, 90, 430, { width: 16, height: 16 }).font(fontLight).fontSize(10).text('Sistema de amortización', 115, 425).fontSize(10).font(fontMedium).
        text(amotizationype, 115, 439);

      doc.roundedRect(300, 415, 210, 55, 5)
        .fill('#F3F4F6').fillColor('#0000').image(charts, 322, 430, { width: 16, height: 16 }).font(fontLight).fontSize(10).text('Tasa de interés', 345, 425).fontSize(10).font(fontMedium).
        text("Será la vigente al momento del desembolso", 345, 439, { width: 150 });

      // mandale image
      const sign = join(process.cwd(), "assets/images/vigilado-sign.png");
      doc.image(sign, 20, 340, { width: 15, height: 260 });

      doc.moveDown(3).font(fontLight).text("A partir de la fecha, podrá buscar y seleccionar la vivienda que cumpla con sus gustos y necesidades, tenga en cuenta que el valor del crédito no podrá exceder los porcentajes definidos en la Ley de Vivienda según el tipo de inmueble.", 70);

      doc.moveDown().text("Las condiciones financieras definitivas de la operación estarán sujetas a las que tenga vigente el Banco al momento del desembolso.")

      doc.moveDown().text("La presente preaprobación está sujeta a los términos y condiciones establecidos en las políticas públicas de Banco Caja Social, así como en los lineamientos definidos por la ley.")

      doc.moveDown().text("En los próximos días un asesor se comunicará con usted para informarle los documentos que se requieren para ratificar la aprobación.")

      doc.moveDown(4).text("Cordialmente,")
      doc.moveDown(0.5).fillColor("#005DA2").font(fontMedium).text("Banco Caja Social")
      const buffer = [];
      doc.on('data', buffer.push.bind(buffer));
      doc.on('end', () => {
        const data = Buffer.concat(buffer);
        resolve(data)
      })
      doc.end()
    })
    return pdfBuffer;
  }
}
