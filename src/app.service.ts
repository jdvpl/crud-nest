import { Injectable } from '@nestjs/common';
import PDFDocumentWithTables from 'pdfkit-table';
import axios from 'axios';
import * as nodemailer from 'nodemailer';
import * as smtpTransport from 'nodemailer-smtp-transport';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import * as fs from 'fs';

const city = "Bogota"
const date = "19 de septiembre de 2023"
const fullName = "LEIDI PAOLA VALVUENA MARTINEZ";
const ccDocumentNumberCity = "C.C 80.987.875 de Bogotá";
const maxAmount = '$67.986.824 pesos';
const termFinance = '24 meses';
const amotizationype = "Cuota fija en pesos";

const basePathURL = "https://aziddevstacmrtggse2000.blob.core.windows.net/aziddevstcoimge2000/approvals";

async function fetchImage(imagePath: string, basePath: string = basePathURL) {
  const image = await axios
    .get(basePath + imagePath, {
      responseType: 'arraybuffer'
    })
  return image.data;
}

async function getFont(url: string) {
  const response = await axios.get(basePathURL + url, {
    responseType: 'arraybuffer',
  });
  const buffer = Buffer.from(response.data);
  return buffer;
}
@Injectable()
export class AppService {
  constructor(
    private readonly configService: ConfigService,
  ) { }
  async generatePDF(): Promise<{ doc: string, name: string }> {
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
    return { doc: pdfBuffer.toString("base64"), name: `carta_aprobacion_${city}` };
  }

  async sendEmail(): Promise<{ email: string }> {
    const mailer = nodemailer.createTransport(
      smtpTransport({
        host: 'sandbox.smtp.mailtrap.io',
        port: 2525,
        auth: {
          user: "4e5c3e15a92ad4",
          pass: "47883064178c74"
        }
      })
    );

    type gender = "F" | "M";

    const basePathImg = this.configService.get("BASEPATH_EMAIL_IMGS");
    const urlRobotoLight = 'https://fonts.googleapis.com/css2?family=Roboto:wght@300&display=swap';
    const urlRobotoMedium = 'https://fonts.googleapis.com/css2?family=RobotoBold:wght@500&display=swap';
    const gender: gender = "F";
    const bannerGender = gender === "F" ? `${basePathImg}femaleBanner.svg` : `${basePathImg}maleBanner.svg`;
    const appreciated = gender === "F" ? 'Apreciada' : 'Apreciado';
    const nameUser = "Luz Agudelo ";
    const price = '$ 42.319.075';
    const term = "5 años";

    const pdfPath = join(process.cwd(), "assets/img/bcs_carta_preaprobado_CC17168784.pdf")
    const pdf = fs.readFileSync(pdfPath).toString("base64");
    const mailOptions = {
      from: 'juanda554242@gmail.com',
      to: 'juanda554242@gmail.com',
      subject: 'Carta de preaprobacion',
      html: `<html lang="es"><head><meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>@import url("${urlRobotoLight}"); @import url("${urlRobotoMedium}"); .white{ color: white;} .textCenter{ text-align: center;} .py2{ padding-top: 1rem; padding-bottom: 1rem;} *{ margin: 0; padding: 0;} .fRoboto{ font-family: 'Roboto', sans-serif;} .w90{ width: 85%; margin: auto;} .p0m0{ display: flex; flex-direction: column;} .ftBlue{ color: #005DA2;} .my1{ margin-top: 1rem; max-width: 1rem;} .mt3{ margin-top: 2rem;} .ftBold{ font-family: 'RobotoBold', sans-serif; font-weight: 700;} .mt1{ margin-top: 0.5rem;} .justify{ display: flex; justify-content: flex-start;} .mauto{ margin: auto;} .w10{ width: 5%;} .signImg{ margin-top: 2.5rem; margin-right: 1rem; margin-left: 1rem;} .bgFeeImg{ padding: 0; margin: 0; background-image: url('${basePathImg}feeBg.svg'); background-repeat: no-repeat; background-position: center; background-size: cover; width: 255px; height: 255px;} .blueAjunts{ padding-top: 33%; font-size: 12px; font-weight: 700; width: 60%; margin: auto; color: #0072C8;} .txtTerm{ font-size: 16px; padding-top: 0.4rem;} .fs27{ font-size: 24px;} .ftNormal{ letter-spacing: normal;} .fcApre{ color: #00253D;} .colorPre{ color: #496374;} .pt2{ padding-top: 2rem;} .my5{ margin-top: 3rem; margin-bottom: 3rem;} .mb5{ margin-bottom: 3rem;} .f20{ font-size: 20px;} .ftxtNormal{ text-transform: none;} .mx1{ margin: 0 3px 0 3px;} .bgWhite{ background-color: white;} .dflex{ display: flex;} .w60{ width: 40%; margin-left: 3%;} .w30{ width: 70%; display: flex; justify-content: end;} .w100{ width: 100%;} .pt4{ padding-top: 2rem;} @media (max-width:400px){ .dflex{ flex-direction: column; justify-content: center; place-items: center;} .w60{ width: 100%;} .w30{ width: 100%;} .w10{ display: none;}} </style></head><body><main class="w100 bgWhite"><header><div><a href="https://www.bancocajasocial.com"><img src="${basePathImg}headerBannerClick.svg" alt="" width="100%" class="p0m0"></a></div><div class="p0m0"><img src="${bannerGender}" alt="" class="p0m0" width="100%"></div></header><div class="w90 bgWhite"><p class="my1 fRoboto fcApre">${appreciated}</p><p class="ftBold mt1 f20">${nameUser}</p></div><div class="dflex w100 mt3"><div class="w10"><div class="signImg"><img src="${basePathImg}signing.svg" alt="" height="70%"></div></div><div class="w60"><img src="${basePathImg}bodyText.svg" alt="" width="100%"></div><div class="w30"><div class="mauto my5"><div class="bgFeeImg textCenter"><p class="fRoboto colorPre pt4">Monto preaprobado</p><p class="ftBlue fs27 mt1 ftBold">${price}</p><p class="txtTerm colorPre fRoboto">Plazo | <span class="ftBlue ftNormal ftxtNormal">${term}</span></p><p class="blueAjunts ftBold">Adjunto encontrará la carta de preaprobación. </p></div></div></div></div><footer><img src="${basePathImg}footer.svg" alt="" width="100%"></footer></main></body></html>`,
      attachments: [{
        filename: 'carta_preaprobacion.pdf',
        content: pdf
      }]
    };

    mailer.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log('Correo electrónico enviado: ' + info.response);
      }
    });

    return { email: "juanda54242@gmail.com" }
  }
}
