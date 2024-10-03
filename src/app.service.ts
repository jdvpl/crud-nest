import { Injectable } from '@nestjs/common';
import PDFDocumentWithTables from 'pdfkit-table';
import axios from 'axios';
import * as nodemailer from 'nodemailer';
import * as smtpTransport from 'nodemailer-smtp-transport';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import * as fs from 'fs';

const city = 'Bogotá';
const isMortgage = true;
const date = '19 de septiembre de 2023';
// const fullName = ['LEIDI PAOLA VALVUENA MARTINEZ', 'Pepito Perez'];
const fullName = ['LEIDI PAOLA VALVUENA MARTINEZ'];
// const ccDocumentNumber = ['CC 80987875', 'CC 123456789'];
const ccDocumentNumber = ['CC 80987875'];
const maxAmount = '$67.986.824';
const termFinance = '24 meses';
const amotizationype = 'Cuota fija Pesos';
// const strategyName = 'Gran Salón Inmobiliario';
const strategyName = null;

const basePathURL =
  'https://aziddevstacmrtggse2000.blob.core.windows.net/aziddevstcoimge2000/approvals';

async function fetchImage(imagePath: string, basePath: string = basePathURL) {
  const image = await axios.get(basePath + imagePath, {
    responseType: 'arraybuffer',
  });
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
  constructor(private readonly configService: ConfigService) {}
  async generatePDF(): Promise<Buffer> {
    const pdfBuffer: Buffer = await new Promise(async (resolve) => {
      const doc = new PDFDocumentWithTables({
        size: 'LETTER',
        bufferPages: true,
        autoFirstPage: false,
        margin: 0,
      });
      const fontRobotoLigth = '/fonts/Roboto-Light.ttf';
      const fontRobotoMediumPath = '/fonts/Roboto-Medium.ttf';

      const [
        fontRobotoLight,
        fontRobotoMedium,
        headerLeft,
        headerRight,
        leftSign,
        footerSign,
      ] = await Promise.all([
        getFont(fontRobotoLigth),
        getFont(fontRobotoMediumPath),
        fetchImage('/images/headerLeft.png'),
        fetchImage('/images/headerRight.png'),
        fetchImage('/images/vigilado-sign.png'),
        fetchImage('/images/V2/firma.png'),
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
      doc.fontSize(10).text(`${city}, ${date}`, 50, 130);
      doc.moveDown(2).fontSize(10).text('Reciba un cordial saludo');
      fullName.forEach((name, index) => {
        const cc = ccDocumentNumber[index] || '';
        const leftMargin = 50;
        const ccWidth = doc.widthOfString(cc) - 180;
        doc
          .moveDown()
          .font('Roboto-Medium')
          .fontSize(10)
          .text(name.toUpperCase(), leftMargin, doc.y, {
            align: 'left',
            continued: true,
          });

        doc.fontSize(10).text(cc, ccWidth, doc.y, {
          align: 'right',
        });
      });

      doc
        .moveDown()
        .fontSize(10)
        .font('Roboto-Medium')
        .text('Asunto: ', 50, 245)
        .font('Roboto-Light')
        .text('Preaprobado crédito de vivienda', 86, 245);

      if (strategyName) {
        doc
          .moveDown()
          .fontSize(10)
          .font('Roboto-Medium')
          .text('Estrategia: ', 50, 250)
          .font('Roboto-Light')
          .text(strategyName, 102, 250);
      }

      doc.text('', 50);
      doc
        .moveDown()
        .fontSize(10)
        .text(
          'Para el Banco Caja Social es grato comunicarle(s) que, de acuerdo con la información suministrada por usted(es) y la autorización para estudiar la viabilidad de la solicitud de crédito de vivienda, hemos generado un preaprobado bajo las siguientes características:',
          { width: 520, align: 'justify' },
        );

      let heightCards = strategyName ? 330 : 315;
      doc
        .text('Monto máximo', 50, heightCards)
        .font('Roboto-Medium')
        .text(maxAmount, 200, heightCards);
      heightCards += 15;
      doc
        .font('Roboto-Light')
        .text('Sistema de amortización', 50, heightCards)
        .font('Roboto-Medium')
        .text(amotizationype, 200, heightCards);
      heightCards += 15;
      doc
        .font('Roboto-Light')
        .text('Plazo', 50, heightCards)
        .font('Roboto-Medium')
        .text(termFinance, 200, heightCards);
      // mandale image
      heightCards += 15;
      doc
        .font('Roboto-Light')
        .text('Línea de crédito', 50, heightCards)
        .font('Roboto-Medium')
        .text(
          isMortgage ? 'Crédito Hipotecario' : 'Cesión de Cartera Hipotecaria',
          200,
          heightCards,
        );

      // lefsign image
      doc.image(leftSign, 13, 290, { width: 15, height: 260 });
      doc.text('', 50);
      doc
        .moveDown(2)
        .font('Roboto-Light')
        .text(
          'Para continuar con el trámite de la solicitud, es requisito entregar los documentos soporte de acuerdo con su actividad económica, antes de 60 días calendario a partir de la fecha de esta comunicación. Dicha documentación deberá ser entregada al asesor del Banco que lo(s) está acompañando.',
          { width: 520, align: 'justify' },
        );

      doc.moveDown();

      doc.text(
        'Es importante tener presente que, las condiciones del preaprobado están sujetas al cumplimiento de las políticas y los procesos definidos por la Entidad, dentro de los cuales usted(es) debe(n) conservar el nivel de ingresos informado, mantener su capacidad de endeudamiento y realizar el pago oportuno de sus obligaciones financieras.',
        { width: 520, align: 'justify' },
      );

      doc.moveDown();
      doc.text(
        'La presente comunicación no constituye oferta comercial de acuerdo con lo establecido en la normatividad comercial vigente.',
        { width: 520, align: 'justify' },
      );
      doc.moveDown();
      doc.text(
        'Agradecemos su confianza y le(s) reiteramos nuestro interés en acompañarle(s) con nuestros productos y servicios para seguir alcanzando las metas propuestas.',
        { width: 520, align: 'justify' },
      );

      doc.moveDown().font('Roboto-Light').text('Cordialmente,');
      doc
        .moveDown(strategyName ? 6.5 : 6.5)
        .font('Roboto-Medium')
        .text('Juan Francisco Sánchez Pérez')
        .font('Roboto-Light')
        .text('Vicepresidente Comercial')
        .font('Roboto-Medium')
        .text('Banco Caja Social');
      doc.image(footerSign, 50, strategyName ? 620 : 595, {
        width: 100,
        height: 40,
      });

      doc.moveDown(strategyName ? 2 : 3.5);
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
    });
    return pdfBuffer;
  }

  async sendEmail(): Promise<{ email: string }> {
    const mailer = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'juanda554242@gmail.com',
        pass: 'mquriominjfoficv',
      },
      disableFileAccess: true,
    });

    const URLIMAGE = this.configService.get('BASEPATH_EMAIL_IMGS');
    const urlRobotoLight =
      'https://fonts.googleapis.com/css2?family=Roboto:wght@300&display=swap';
    const urlRobotoMedium =
      'https://fonts.googleapis.com/css2?family=RobotoBold:wght@500&display=swap';
    const nameUser = 'Luz Agudelo ';
    const price = '$ 42.319.075';
    const term = '5';
    const pdfPath = join(
      process.cwd(),
      'assets/img/bcs_carta_preaprobado_CC17168784.pdf',
    );
    const pdf = fs.readFileSync(pdfPath).toString('base64');
    const url = encodeURIComponent(
      '50d6e86c41c5068e:1087b69bae3c553352ec2686640d513f0e4aa2dba87626fd4fcc823f40d719760e3600522a0bf92f67bf799014baa038328c01fc5c1ac6276c05dc085649c90f362a7d3c86a8044e75c33fcf126fe82b3ed625423defcbd3c331b3082f737eaf0c09a9273578f6cada8360d0e977b4085b14d0a25d2be6de:427d83478b4340f53f81f71f76c9087580dac7a8462cb65dff18940cb409b078a054de7ba637b675fbe9719520b407f977255a154dd81182574464b821:0b56145ccf753a20f985020f0ace75e4',
    );
    const correctUrl = 'http://localhost:3000/vivienda/email/' + url;
    const html = `<!DOCTYPE html><html lang=es><meta charset=UTF-8><meta content="IE=edge"http-equiv=X-UA-Compatible><meta content="width=device-width,initial-scale=1"name=viewport><head><style> @import url("${urlRobotoLight}");@import url("${urlRobotoMedium}");.textBgGray{font-family: 'Roboto', sans-serif;font-size: 12px;}.t-white{color:#fff !important; }.bggray{background:#496374 !important;}.textCenter{text-align:center}.py2{padding:1rem 0}.p0m0{display:flex;flex-direction:column}.ftBlue{color:#0072c8 !important;}.ftBold{font-family:RobotoBold,sans-serif;font-weight:700;}.mt1{margin-top:.5rem;}.mauto{margin:auto;}.bgFeeImg{padding-bottom:1rem;padding-top:1.075rem;background:url('${URLIMAGE}feeBg.png') !important;margin:auto;width:50%;border-radius:9px;background-size:cover !important;}.underline{text-decoration:underline !important;}.txtTerm{font-size:16px;padding-top:.4rem}.fs27{font-size:25px;margin-bottom:5px;}.ftNormal{letter-spacing:normal;}.colorPre{font-size:13px;color:#496374;text-transform:uppercase;letter-spacing:2px;font-family:Roboto,sans-serif}.pb2{padding-bottom:1rem}.mt5{margin-top:2rem}.f20{font-size:20px}.ftxtNormal{text-transform:none}.bgWhite{background:url('${URLIMAGE}bgImage.png') !important;background-size: cover !important;}.w100{width:100%}.containerEmail{width:75%;margin:auto}.bodyEmail{background:url('${URLIMAGE}bgImage.png') !important;background-size: cover !important;}@media (max-width:550px){.containerEmail{width:100%}.bgFeeImg{width:90%;background-size:cover;background-repeat:no-repeat;}} </style></head><body><div class="bodyEmail"><div class="bggray textBgGray containerEmail py2 textCenter"><span class="t-white  bggray">Si no puede visualizar correctamente este E-mail, <a class="t-white bggray underline" href=${correctUrl}>haga clic aquí </a>y agréguenos a la lista de contactos.</span></div><div class="containerEmail w100 bgWhite"><header><div class=p0m0><img alt=""src=${URLIMAGE}banner.png class="p0m0 w100"></div></header><div class=mt5><p class="bgWhite ftBold mt1 textCenter f20 ftBlue ">Hola, ${nameUser}</div><div class="w100"><img alt=""src=${URLIMAGE}bodyText.png width=100%></div><div class=w100><div class="mauto "><div class="bgFeeImg textCenter"><p class="fRoboto colorPre">Valor preaprobado<p class="ftBlue fs27 mt1 ftBold">${price}<p class="txtTerm colorPre fRoboto">Plazo | <span class="ftBlue ftNormal ftxtNormal">${term} meses</span></div></div></div><footer><img alt=""src=${URLIMAGE}footer.png width=100%></footer></div></div> </body></html>`;
    console.log('🚀 ~ AppService ~ sendEmail ~ html:', html);
    const mailOptions = {
      from: 'juanda554242@gmail.com',
      // to: 'juanda554242@gmail.com',
      // to: 'yara.orozco10@gmail.com',
      to: 'jdsuarez@fgs.co',

      subject: 'Carta de preaprobacion Prueba x',
      html: html,
      attachments: [
        {
          filename: 'carta_preaprobacion.pdf',
          content: pdf,
        },
      ],
    };

    mailer.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log('Correo electrónico enviado: ' + info.response);
      }
    });

    return { email: 'juanda54242@gmail.com' };
  }
}
