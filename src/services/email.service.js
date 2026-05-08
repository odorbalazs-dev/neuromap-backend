import { Resend } from "resend";
import { env } from "../config/env.js";
import { buildReportEmail } from "../templates/reportEmail.js";
import { generatePdfBuffer } from "./pdf.service.js";

const resend = new Resend(env.RESEND_API_KEY);

function getSafeLang(lang) {
  const allowed = ["hu", "en", "de", "it", "es", "zh", "ja", "ar", "pl", "pt", "fr"];
  return allowed.includes(lang) ? lang : "en";
}

function normalizeRecipients(to) {
  if (!to) return [];

  if (Array.isArray(to)) {
    return to.map((v) => String(v).trim()).filter(Boolean);
  }

  return String(to)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function buildPdfFilename(lang) {
  const safeLang = getSafeLang(lang);

  const map = {
    hu: "neuromap-kids-riport.pdf",
    en: "neuromap-kids-report.pdf",
    de: "neuromap-kids-bericht.pdf",
    it: "neuromap-kids-report.pdf",
    es: "neuromap-kids-informe.pdf",
    zh: "neuromap-kids-report.pdf",
    ja: "neuromap-kids-report.pdf",
    ar: "neuromap-kids-report.pdf",
    pl: "neuromap-kids-raport.pdf",
    pt: "neuromap-kids-relatorio.pdf",
    fr: "neuromap-kids-rapport.pdf"
  };

  return map[safeLang] || map.en;
}

function getRecoveryCopy(lang) {
  const safeLang = getSafeLang(lang);

  const copy = {
    hu: {
      subject: "A NeuroMap Kids riportod még vár rád",
      preheader: "A kérdőívet már elkezdted, a riport elkészítését még be tudod fejezni.",
      title: "A riportod még nem készült el",
      greeting: "Szia",
      body:
        "Láttuk, hogy eljutottál a NeuroMap Kids kiértékelés fizetési lépéséig, de a folyamat nem fejeződött be. Ha szeretnéd, innen biztonságosan folytathatod, és a fizetés után elkészül a személyre szabott PDF riport.",
      cta: "Riport folytatása",
      note: "Ha már nem szeretnéd folytatni, nincs további teendőd.",
      footer: "NeuroMap Kids"
    },
    en: {
      subject: "Your NeuroMap Kids report is still waiting",
      preheader: "You started the questionnaire. You can still complete your report.",
      title: "Your report has not been completed yet",
      greeting: "Hi",
      body:
        "We noticed that you reached the payment step for your NeuroMap Kids assessment, but the process was not completed. You can safely continue from here, and after payment your personalized PDF report will be generated.",
      cta: "Continue report",
      note: "If you no longer want to continue, no action is needed.",
      footer: "NeuroMap Kids"
    },
    de: {
      subject: "Dein NeuroMap Kids Bericht wartet noch",
      preheader: "Du hast den Fragebogen begonnen und kannst den Bericht noch abschließen.",
      title: "Dein Bericht wurde noch nicht abgeschlossen",
      greeting: "Hallo",
      body:
        "Du warst bereits beim Zahlungsschritt der NeuroMap Kids Auswertung, aber der Vorgang wurde nicht abgeschlossen. Du kannst hier sicher fortfahren. Nach der Zahlung wird dein personalisierter PDF-Bericht erstellt.",
      cta: "Bericht fortsetzen",
      note: "Wenn du nicht fortfahren möchtest, musst du nichts weiter tun.",
      footer: "NeuroMap Kids"
    },
    it: {
      subject: "Il tuo report NeuroMap Kids ti sta aspettando",
      preheader: "Hai iniziato il questionario e puoi ancora completare il report.",
      title: "Il tuo report non è ancora stato completato",
      greeting: "Ciao",
      body:
        "Abbiamo visto che sei arrivato alla fase di pagamento della valutazione NeuroMap Kids, ma il processo non è stato completato. Puoi continuare in modo sicuro da qui e, dopo il pagamento, verrà generato il tuo report PDF personalizzato.",
      cta: "Continua il report",
      note: "Se non vuoi continuare, non devi fare nulla.",
      footer: "NeuroMap Kids"
    },
    es: {
      subject: "Tu informe de NeuroMap Kids sigue esperándote",
      preheader: "Empezaste el cuestionario y aún puedes completar tu informe.",
      title: "Tu informe aún no se ha completado",
      greeting: "Hola",
      body:
        "Vimos que llegaste al paso de pago de la evaluación NeuroMap Kids, pero el proceso no se completó. Puedes continuar de forma segura desde aquí y, después del pago, se generará tu informe PDF personalizado.",
      cta: "Continuar informe",
      note: "Si ya no quieres continuar, no tienes que hacer nada.",
      footer: "NeuroMap Kids"
    },
    zh: {
      subject: "你的 NeuroMap Kids 报告仍在等待完成",
      preheader: "你已开始问卷，仍可以继续完成报告。",
      title: "你的报告尚未完成",
      greeting: "你好",
      body:
        "我们注意到你已到达 NeuroMap Kids 评估的付款步骤，但流程尚未完成。你可以从这里安全继续，付款后将生成你的个性化 PDF 报告。",
      cta: "继续报告",
      note: "如果你不想继续，无需采取任何操作。",
      footer: "NeuroMap Kids"
    },
    ja: {
      subject: "NeuroMap Kids レポートがまだ完了していません",
      preheader: "質問票を開始済みです。レポート作成をまだ完了できます。",
      title: "レポートはまだ完了していません",
      greeting: "こんにちは",
      body:
        "NeuroMap Kids 評価の支払いステップまで進みましたが、手続きが完了していません。ここから安全に再開できます。支払い後、個別PDFレポートが作成されます。",
      cta: "レポートを続ける",
      note: "続けない場合、追加の操作は不要です。",
      footer: "NeuroMap Kids"
    },
    ar: {
      subject: "تقرير NeuroMap Kids الخاص بك لا يزال بانتظارك",
      preheader: "لقد بدأت الاستبيان وما زال بإمكانك إكمال التقرير.",
      title: "لم يكتمل تقريرك بعد",
      greeting: "مرحبًا",
      body:
        "لاحظنا أنك وصلت إلى خطوة الدفع في تقييم NeuroMap Kids، لكن العملية لم تكتمل. يمكنك المتابعة بأمان من هنا، وبعد الدفع سيتم إنشاء تقرير PDF المخصص لك.",
      cta: "متابعة التقرير",
      note: "إذا لم تعد ترغب في المتابعة، فلا يلزمك فعل أي شيء.",
      footer: "NeuroMap Kids"
    },
    pl: {
      subject: "Twój raport NeuroMap Kids nadal czeka",
      preheader: "Rozpoczęto kwestionariusz. Nadal możesz dokończyć raport.",
      title: "Twój raport nie został jeszcze ukończony",
      greeting: "Cześć",
      body:
        "Widzimy, że dotarłeś/dotarłaś do etapu płatności oceny NeuroMap Kids, ale proces nie został ukończony. Możesz bezpiecznie kontynuować tutaj, a po płatności zostanie wygenerowany spersonalizowany raport PDF.",
      cta: "Kontynuuj raport",
      note: "Jeśli nie chcesz kontynuować, nie musisz nic robić.",
      footer: "NeuroMap Kids"
    },
    pt: {
      subject: "Seu relatório NeuroMap Kids ainda está esperando",
      preheader: "Você iniciou o questionário e ainda pode concluir o relatório.",
      title: "Seu relatório ainda não foi concluído",
      greeting: "Olá",
      body:
        "Percebemos que você chegou à etapa de pagamento da avaliação NeuroMap Kids, mas o processo não foi concluído. Você pode continuar com segurança por aqui e, após o pagamento, seu relatório PDF personalizado será gerado.",
      cta: "Continuar relatório",
      note: "Se você não quiser continuar, não precisa fazer mais nada.",
      footer: "NeuroMap Kids"
    },
    fr: {
      subject: "Votre rapport NeuroMap Kids vous attend toujours",
      preheader: "Vous avez commencé le questionnaire et pouvez encore finaliser votre rapport.",
      title: "Votre rapport n’est pas encore terminé",
      greeting: "Bonjour",
      body:
        "Nous avons vu que vous êtes arrivé à l’étape de paiement de l’évaluation NeuroMap Kids, mais le processus n’a pas été terminé. Vous pouvez reprendre en toute sécurité depuis ce lien. Après paiement, votre rapport PDF personnalisé sera généré.",
      cta: "Continuer le rapport",
      note: "Si vous ne souhaitez plus continuer, aucune action n’est nécessaire.",
      footer: "NeuroMap Kids"
    }
  };

  return copy[safeLang] || copy.en;
}

function buildRecoveryEmail({ lang, name, checkoutUrl }) {
  const safeLang = getSafeLang(lang);
  const t = getRecoveryCopy(safeLang);
  const displayName = String(name || "").trim();
  const greeting = displayName ? `${t.greeting} ${displayName},` : `${t.greeting},`;

  const dir = safeLang === "ar" ? "rtl" : "ltr";

  const html = `
<!doctype html>
<html lang="${safeLang}" dir="${dir}">
  <body style="margin:0;padding:0;background:#f6fbff;font-family:Arial,sans-serif;color:#1f2937;">
    <div style="display:none;max-height:0;overflow:hidden;">${t.preheader}</div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6fbff;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:22px;overflow:hidden;border:1px solid #d7eef9;">
            <tr>
              <td style="height:8px;background:#1197d5;"></td>
            </tr>

            <tr>
              <td style="padding:28px 24px 10px;text-align:${dir === "rtl" ? "right" : "left"};">
                <div style="font-size:13px;font-weight:800;color:#0b86bf;margin-bottom:10px;">NeuroMap Kids</div>
                <h1 style="margin:0;color:#1f2937;font-size:24px;line-height:1.2;">${t.title}</h1>
              </td>
            </tr>

            <tr>
              <td style="padding:10px 24px 6px;text-align:${dir === "rtl" ? "right" : "left"};">
                <p style="font-size:16px;line-height:1.6;margin:0 0 14px;color:#344054;">${greeting}</p>
                <p style="font-size:16px;line-height:1.6;margin:0;color:#344054;">${t.body}</p>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:26px 24px 18px;">
                <a href="${checkoutUrl}" style="display:inline-block;background:#1197d5;color:#ffffff;text-decoration:none;border-radius:14px;padding:14px 22px;font-weight:800;font-size:16px;">
                  ${t.cta}
                </a>
              </td>
            </tr>

            <tr>
              <td style="padding:0 24px 24px;text-align:${dir === "rtl" ? "right" : "left"};">
                <p style="font-size:13px;line-height:1.5;margin:0;color:#667085;">${t.note}</p>
              </td>
            </tr>

            <tr>
              <td style="padding:16px 24px;background:#f1faff;color:#667085;font-size:12px;text-align:center;">
                ${t.footer}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `${t.title}

${greeting}

${t.body}

${t.cta}: ${checkoutUrl}

${t.note}

${t.footer}`;

  return {
    subject: t.subject,
    html,
    text
  };
}

export async function sendReportEmail({ to, lang, name, reportText, payload }) {
  const recipients = normalizeRecipients(to);
  const safeLang = getSafeLang(lang);
  const cleanReportText = String(reportText || "").trim();

  try {
    console.log("[email] start", {
      recipients,
      lang: safeLang,
      name,
      hasReportText: !!cleanReportText,
      reportLength: cleanReportText.length,
      from: env.EMAIL_FROM
    });

    if (!env.RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY.");
    }

    if (!env.EMAIL_FROM) {
      throw new Error("Missing EMAIL_FROM.");
    }

    if (recipients.length === 0) {
      throw new Error("Missing recipient email address.");
    }

    if (!cleanReportText) {
      throw new Error("Missing reportText for email sending.");
    }

    const { subject, html, text } = buildReportEmail({
      lang: safeLang,
      name,
      reportText: cleanReportText,
      payload
    });

    const pdfBuffer = await generatePdfBuffer({
      name,
      reportText: cleanReportText,
      lang: safeLang,
      payload
    });

    if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
      throw new Error("PDF generation returned an empty or invalid buffer.");
    }

    console.log("[email] template built", {
      subjectLength: subject.length,
      htmlLength: html.length,
      textLength: text.length,
      pdfBytes: pdfBuffer.length
    });

    const response = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: recipients,
      subject,
      html,
      text,
      attachments: [
        {
          filename: buildPdfFilename(safeLang),
          content: pdfBuffer.toString("base64")
        }
      ]
    });

    console.log("[email] send success", response);

    return response;
  } catch (error) {
    console.error("[email] send failed", {
      message: error?.message || "Unknown email error",
      stack: error?.stack || null,
      recipients,
      lang: safeLang
    });

    throw error;
  }
}

export async function sendCheckoutRecoveryEmail({ to, lang, name, checkoutUrl }) {
  const recipients = normalizeRecipients(to);
  const safeLang = getSafeLang(lang);

  try {
    console.log("[recovery-email] start", {
      recipients,
      lang: safeLang,
      name,
      hasCheckoutUrl: !!checkoutUrl,
      from: env.EMAIL_FROM
    });

    if (!env.RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY.");
    }

    if (!env.EMAIL_FROM) {
      throw new Error("Missing EMAIL_FROM.");
    }

    if (recipients.length === 0) {
      throw new Error("Missing recipient email address.");
    }

    if (!checkoutUrl) {
      throw new Error("Missing checkoutUrl for recovery email.");
    }

    const { subject, html, text } = buildRecoveryEmail({
      lang: safeLang,
      name,
      checkoutUrl
    });

    const response = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: recipients,
      subject,
      html,
      text
    });

    console.log("[recovery-email] send success", response);

    return response;
  } catch (error) {
    console.error("[recovery-email] send failed", {
      message: error?.message || "Unknown recovery email error",
      stack: error?.stack || null,
      recipients,
      lang: safeLang
    });

    throw error;
  }
}