import { Injectable } from '@nestjs/common';
import PDFDocumentWithTables from 'pdfkit-table';
import axios from 'axios';

const city = "Bogota"
const date = "19 de septiembre de 2023"
const fullName = "LEIDI PAOLA VALVUENA MARTINEZ";
const ccDocumentNumberCity = "C.C 80.987.875 de Bogotá";
const maxAmount = '$67.986.824 pesos';
const termFinance = '24 meses';
const amotizationype = "Cuota fija en pesos";

const basePath = "https://aziddevstacmrtggse2000.blob.core.windows.net/aziddevstcoimge2000/approvals";

async function fetchImage(imagePath: string) {
  const image = await axios
    .get(basePath + imagePath, {
      responseType: 'arraybuffer'
    })
  return image.data;
}

async function getFont(url: string) {
  const response = await axios.get(basePath + url, {
    responseType: 'arraybuffer',
  });
  const buffer = Buffer.from(response.data);
  return buffer;
}
@Injectable()
export class AppService {
  async generatePDF(): Promise<{ doc: string }> {
    const pdfBuffer: Buffer = await new Promise(async resolve => {
      const doc = new PDFDocumentWithTables(
        {
          size: 'LETTER',
          bufferPages: true,
          autoFirstPage: false,
        }
      );
      const fontRobotoLigth = '/fonts/Roboto-Light.ttf';
      const fontRobotoMediumPath = "/fonts/Roboto-Medium.ttf";


      const [fontRobotoLight, fontRobotoMedium, logo, calendar, mandalaImage, charts, sign] = await Promise.all([
        getFont(fontRobotoLigth),
        getFont(fontRobotoMediumPath),
        fetchImage("/images/logo.png"),
        fetchImage("/images/Calendar.png"),
        fetchImage("/images/mandala.png"),
        fetchImage("/images/Charts.png"),
        fetchImage("/images/vigilado-sign.png")
      ]);

      doc.registerFont('Roboto-Light', fontRobotoLight);
      doc.registerFont('Roboto-Medium', fontRobotoMedium);
      doc.font("Roboto-Light");
      doc.on('pageAdded', () => {
        doc.image(logo, 0, 0, { width: 630, height: 150 })
      })
      doc.addPage();
      doc.fontSize(10);
      doc.text(`${city}, ${date}`, 70, 150);
      doc.moveDown(2).fontSize(12).text("Señores (es)");
      doc.moveDown(1.1).font("Roboto-Medium").fontSize(13).text(fullName);
      doc.fontSize(13).moveDown(0.5).font("Roboto-Light").text(ccDocumentNumberCity);
      doc.moveDown().fontSize(10).font("Roboto-Medium")
        .text("Ref: ", 70, 280).font("Roboto-Light").text('Respuesta a solicitud financiación de vivienda', 92, 280);

      doc.text('', 70)
      doc.moveDown(1.3).fontSize(10).text('Apreciado señor (a), reciba un cordial saludo. Para el Banco Caja Social es grato comunicarle que su crédito hipotecario ha sido preaprobado con las siguientes características:', { width: doc.page.width - 150, align: 'justify' })

      doc.roundedRect(80, 350, 210, 55, 5)
        .fill('#F3F4F6').fillColor('#0000').image(calendar, 90, 368, { width: 16, height: 16 }).text('Monto máximo', 115, 365).fontSize(15).font("Roboto-Medium").
        text(maxAmount, 115, 379);

      doc.roundedRect(300, 350, 210, 55, 5)
        .fill('#F3F4F6').fillColor('#0000').image(calendar, 312, 368, { width: 16, height: 16 }).font("Roboto-Light").fontSize(9).text('Plazo', 335, 365).fontSize(15).font("Roboto-Medium").
        text(termFinance, 335, 379);
      // mandale image
      doc.image(mandalaImage, 515, 280, { width: 110, height: 250 })

      doc.roundedRect(80, 415, 210, 55, 5)
        .fill('#F3F4F6').fillColor('#0000').image(charts, 90, 430, { width: 16, height: 16 }).font("Roboto-Light").fontSize(10).text('Sistema de amortización', 115, 425).fontSize(10).font("Roboto-Medium").
        text(amotizationype, 115, 439);

      doc.roundedRect(300, 415, 210, 55, 5)
        .fill('#F3F4F6').fillColor('#0000').image(charts, 322, 430, { width: 16, height: 16 }).font("Roboto-Light").fontSize(10).text('Tasa de interés', 345, 425).fontSize(10).font("Roboto-Medium").
        text("Será la vigente al momento del desembolso", 345, 439, { width: 140 });

      // mandale image
      doc.image(sign, 20, 340, { width: 15, height: 260 });

      doc.text("", 70)
      doc.moveDown(3).font("Roboto-Light").text("A partir de la fecha, podrá buscar y seleccionar la vivienda que cumpla con sus gustos y necesidades, tenga en cuenta que el valor del crédito no podrá exceder los porcentajes definidos en la Ley de Vivienda según el tipo de inmueble.", { width: doc.page.width - 150, align: 'justify' });

      doc.moveDown().text("De ser aprobado el crédito, las condiciones financieras definitivas estarán sujetas a las que tenga vigente el Banco al momento del desembolso.", { width: doc.page.width - 150, align: 'justify' })

      doc.moveDown().text("La presente preaprobación está sujeta a los términos y condiciones establecidos en las políticas del Banco Caja Social, así como en los lineamientos definidos por la ley.", { width: doc.page.width - 150, align: 'justify' })

      doc.moveDown().text("En los próximos días un asesor se comunicará con usted para informarle los documentos que se requieren para ratificar la aprobación.", { width: doc.page.width - 150, align: 'justify' })

      doc.moveDown(4).text("Cordialmente,")
      doc.moveDown(0.5).fillColor("#005DA2").font("Roboto-Medium").text("Banco Caja Social")
      const buffer = [];
      doc.on('data', buffer.push.bind(buffer));
      doc.on('end', () => {
        const data = Buffer.concat(buffer);
        resolve(data)
      })
      doc.end()
    })
    return { doc: pdfBuffer.toString("base64") };
  }
}
