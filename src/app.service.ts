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
const ccDocumentNumberCity = "Cedula de ciudadania 80.987.875 de Bogotá";
const maxAmount = '$67.986.824 pesos';
const termFinance = '24 meses';
const amotizationype = "Cuota fija en pesos";
// const strategyName='Feria Nacional de Vivienda';
const strategyName=null;

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
  async generatePDF(): Promise<Buffer> {
    const pdfBuffer: Buffer = await new Promise(async resolve => {
      const doc = new PDFDocumentWithTables(
        {
          size: 'LETTER',
          bufferPages: true,
          autoFirstPage: false,
          margin:0
        }
      );
      const fontRobotoLigth = '/fonts/Roboto-Light.ttf';
      const fontRobotoMediumPath = "/fonts/Roboto-Medium.ttf";


      const [fontRobotoLight, fontRobotoMedium,  headerLeft, headerRight,leftSign,  footerSign] = await Promise.all([
        getFont(fontRobotoLigth),
        getFont(fontRobotoMediumPath),
        fetchImage("/images/headerLeft.png"),
        fetchImage("/images/headerRight.png"),
        fetchImage("/images/vigilado-sign.png"),
        fetchImage("/images/lastsign.png")
      ]);

      
        
    
      doc.registerFont('Roboto-Light', fontRobotoLight);
      doc.registerFont('Roboto-Medium', fontRobotoMedium);
      doc.font('Roboto-Light');
      doc.on('pageAdded', () => {
        doc.image(headerLeft, 60, 20, { width: 160, height: 65 });
        doc.image(headerRight, 490, 20, { width: 55, height: 65 });
      });
      doc.addPage();
      doc.fontSize(10);
      doc.text(`${city}, ${date}`, 50, 130);
      doc.moveDown(2).fontSize(12).text('Señor (a)');
      doc.moveDown(1.1).font('Roboto-Medium').fontSize(13).text(fullName);
      doc.fontSize(13).moveDown(0.5).font('Roboto-Light').text(ccDocumentNumberCity);
      doc
        .moveDown()
        .fontSize(10)
        .font('Roboto-Medium')
        .text('Ref: ', 50, 265)
        .font('Roboto-Light')
        .text('Respuesta a solicitud financiación de vivienda', 72, 265);

      if (strategyName) {
        doc
          .moveDown()
          .fontSize(10)
          .font('Roboto-Medium')
          .text('Estrategia: ', 50, 285)
          .font('Roboto-Light')
          .text(strategyName, 102, 285);
      }

      doc.text('', 50);
      doc
        .moveDown(1.3)
        .fontSize(10)
        .text(
          'Apreciado señor (a), reciba un cordial saludo. Para el Banco Caja Social es grato comunicarle que su crédito hipotecario ha sido preaprobado con las siguientes características:',
          { width: 520, align: 'justify' },
        );

      let heightCards = strategyName ? 330 + 20 : 330;
      doc
        .text('Monto máximo', 50, heightCards)
        .font('Roboto-Medium')
        .text(maxAmount, 180, heightCards);
      heightCards += 15;
      doc
        .font('Roboto-Light')
        .text('Plazo', 50, heightCards)
        .font('Roboto-Medium')
        .text(termFinance, 180, heightCards);
      // mandale image
      heightCards += 15;
      doc
        .font('Roboto-Light')
        .text('Sistema de amortización', 50, heightCards)
        .font('Roboto-Medium')
        .text(amotizationype, 180, heightCards);
      heightCards += 15;
      doc
        .font('Roboto-Light')
        .text('Tasa de interés', 50, heightCards)
        .font('Roboto-Medium')
        .text(strategyName === 'Feria Nacional de Vivienda'?'Aplica la vigente en la feria':'Será la vigente al momento del desembolso', 180, heightCards);

      // lefsign image
      doc.image(leftSign, 13, 290, { width: 15, height: 260 });
      doc.text('', 50);
      doc
        .moveDown(2)
        .font('Roboto-Light')
        .text(
          'A partir de la fecha, podrá buscar y seleccionar la vivienda que cumpla con sus gustos y necesidades, tenga en cuenta que el valor del crédito no podrá exceder los porcentajes definidos en la Ley de Vivienda según el tipo de inmueble.',
          { width: 520, align: 'justify' },
        );

      doc.moveDown();

      if (strategyName === 'Feria Nacional de Vivienda') {
        doc.text(
          'La aprobación y desembolso del crédito se encuentra sujeta al cumplimiento de las políticas de crédito definidas por el Banco para los créditos hipotecarios; así como en los lineamientos definidos por la ley.',
          { width: 520, align: 'justify' },
        );
        doc.moveDown();
        doc.text(
          'Las tasas aplican para desembolsos realizados hasta el 31 de diciembre de 2023. Tenga en cuenta que en caso de que el desembolso de su crédito hipotecario ocurra después del 31 de diciembre de 2023, se aplicará la tasa plena que se encuentre publicada en la cartelera del Banco el día en que se activa el desembolso.',
          { width: 520, align: 'justify' },
        );
      } else {
        doc.text(
          'La aprobación y desembolso del crédito se encuentra sujeta al cumplimiento de las políticas de crédito definidas por el Banco para los créditos hipotecarios; así como en los lineamientos definidos por la ley. Las condiciones financieras definitivas del crédito estarán sujetas a las que tenga vigente el Banco al momento del desembolso.',
          { width: 520, align: 'justify' },
        );
      }

      doc.moveDown();
      doc.text(
        'En los próximos días un asesor se comunicará con usted para informarle los documentos que se requieren para ratificar la aprobación. La presente comunicación no constituye oferta comercial de acuerdo con lo establecido en la normatividad comercial vigente.',
        { width: 520, align: 'justify' },
      );

      doc.moveDown().font('Roboto-Medium').text('Cordialmente,');
      doc
        .moveDown(strategyName?4.5:6.5)
        .font('Roboto-Medium')
        .text('Esperanza Pérez Mora')
        .font('Roboto-Light')
        .text('Vicepresidenta de Banca Masiva')
        .font('Roboto-Medium')
        .text('Banco Caja Social');
      doc.image(footerSign, 50, strategyName?620:585, { width: 100, height: 40 });

      doc.moveDown(strategyName ? 2 : 5);
      doc.fillColor('#9CA3AF').fontSize(8.5).font('Roboto-Light');
      doc.text(
        'El Banco Caja Social informa que la Defensoría del Consumidor Financiero la ejercen los doctores',
        { align: 'center', width: 520 },
      );
      doc.text(
        'José Guillermo Peña González (defensor principal) y Carlos Alfonso Cifuentes Neira (defensor suplente).',
        { align: 'center', width: 520 },
      );
      doc.text(
        'Dirección: avda. 19 # 114-09, oficina 502. Horario de atención: lunes a viernes, de 8:00 a.m. a 5:00 p.m.',
        { align: 'center', width: 520 },
      );
      doc.text(
        'Teléfonos (601) 213 1322 / 213 1370, en Bogotá, y a los números celulares 321 924 0479 / 323 232 2934 / 323 232 2911. ',
        { align: 'center', width: 520 },
      );
      doc.text('Correo electrónico: defensorbancocajasocial@pgabogados.com.', {
        align: 'center',
        width: 520,
      });

      const buffer = [];
      doc.on('data', buffer.push.bind(buffer));
      doc.on('end', () => {
        const data = Buffer.concat(buffer);
        resolve(data);
      });

      doc.end();
    })
    return pdfBuffer;
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
