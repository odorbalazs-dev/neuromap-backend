function getSafeLang(lang) {
  const allowed = ["hu", "en", "de", "it", "es", "zh", "ja", "ar", "pl", "pt", "fr"];
  return allowed.includes(lang) ? lang : "en";
}

function escapeHtml(value = "") {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getRecoveryCopy(lang) {
  const copy = {
    hu: {
      subject: "A NeuroMap Kids riportod még vár rád",
      preheader: "A válaszaid megvannak, a riportot még be tudod fejezni.",
      title: "A riportod még nincs befejezve",
      greeting: "Szia",
      body1: "A kérdőívet már elkezdted, és eljutottál a fizetési lépésig, de a folyamat nem fejeződött be.",
      body2: "A válaszaid alapján a személyre szabott NeuroMap Kids PDF riport fizetés után elkészül és emailben érkezik.",
      cta: "Riport folytatása",
      reassurance: "Nem történt terhelés. A folytatás biztonságos fizetési oldalon történik.",
      note: "Ha már nem szeretnéd folytatni, nincs további teendőd.",
      footer: "NeuroMap Kids"
    },
    en: {
      subject: "Your NeuroMap Kids report is still waiting",
      preheader: "Your answers are saved. You can still complete your report.",
      title: "Your report is not completed yet",
      greeting: "Hi",
      body1: "You started the questionnaire and reached the payment step, but the process was not completed.",
      body2: "Based on your answers, your personalized NeuroMap Kids PDF report will be generated and sent by email after payment.",
      cta: "Continue report",
      reassurance: "No charge was made. You will continue through a secure payment page.",
      note: "If you no longer want to continue, no action is needed.",
      footer: "NeuroMap Kids"
    },
    de: {
      subject: "Dein NeuroMap Kids Bericht wartet noch",
      preheader: "Deine Antworten sind gespeichert. Du kannst den Bericht noch abschließen.",
      title: "Dein Bericht ist noch nicht abgeschlossen",
      greeting: "Hallo",
      body1: "Du hast den Fragebogen begonnen und den Zahlungsschritt erreicht, aber der Vorgang wurde nicht abgeschlossen.",
      body2: "Auf Basis deiner Antworten wird nach der Zahlung dein personalisierter NeuroMap Kids PDF-Bericht erstellt und per E-Mail gesendet.",
      cta: "Bericht fortsetzen",
      reassurance: "Es wurde nichts berechnet. Die Fortsetzung erfolgt über eine sichere Zahlungsseite.",
      note: "Wenn du nicht fortfahren möchtest, musst du nichts weiter tun.",
      footer: "NeuroMap Kids"
    },
    it: {
      subject: "Il tuo report NeuroMap Kids ti sta aspettando",
      preheader: "Le tue risposte sono salvate. Puoi ancora completare il report.",
      title: "Il tuo report non è ancora completo",
      greeting: "Ciao",
      body1: "Hai iniziato il questionario e sei arrivato alla fase di pagamento, ma il processo non è stato completato.",
      body2: "In base alle tue risposte, dopo il pagamento verrà generato il tuo report PDF personalizzato NeuroMap Kids e inviato via email.",
      cta: "Continua il report",
      reassurance: "Non è stato effettuato alcun addebito. Continuerai su una pagina di pagamento sicura.",
      note: "Se non vuoi continuare, non devi fare nulla.",
      footer: "NeuroMap Kids"
    },
    es: {
      subject: "Tu informe de NeuroMap Kids sigue esperándote",
      preheader: "Tus respuestas están guardadas. Aún puedes completar tu informe.",
      title: "Tu informe aún no está completo",
      greeting: "Hola",
      body1: "Empezaste el cuestionario y llegaste al paso de pago, pero el proceso no se completó.",
      body2: "Según tus respuestas, después del pago se generará tu informe PDF personalizado de NeuroMap Kids y se enviará por email.",
      cta: "Continuar informe",
      reassurance: "No se realizó ningún cargo. Continuarás en una página de pago segura.",
      note: "Si ya no quieres continuar, no tienes que hacer nada.",
      footer: "NeuroMap Kids"
    },
    zh: {
      subject: "你的 NeuroMap Kids 报告仍在等待完成",
      preheader: "你的回答已保存，仍可以继续完成报告。",
      title: "你的报告尚未完成",
      greeting: "你好",
      body1: "你已经开始问卷并到达付款步骤，但流程尚未完成。",
      body2: "根据你的回答，付款后将生成个性化 NeuroMap Kids PDF 报告，并通过电子邮件发送。",
      cta: "继续报告",
      reassurance: "目前没有产生任何扣费。继续时将进入安全支付页面。",
      note: "如果你不想继续，无需采取任何操作。",
      footer: "NeuroMap Kids"
    },
    ja: {
      subject: "NeuroMap Kids レポートがまだ完了していません",
      preheader: "回答は保存されています。レポート作成をまだ完了できます。",
      title: "レポートはまだ完了していません",
      greeting: "こんにちは",
      body1: "質問票を開始し、支払いステップまで進みましたが、手続きは完了していません。",
      body2: "お支払い後、回答内容に基づいた個別の NeuroMap Kids PDF レポートが作成され、メールで送信されます。",
      cta: "レポートを続ける",
      reassurance: "請求は行われていません。安全な決済ページで再開できます。",
      note: "続けない場合、追加の操作は不要です。",
      footer: "NeuroMap Kids"
    },
    ar: {
      subject: "تقرير NeuroMap Kids الخاص بك لا يزال بانتظارك",
      preheader: "تم حفظ إجاباتك، وما زال بإمكانك إكمال التقرير.",
      title: "لم يكتمل تقريرك بعد",
      greeting: "مرحبًا",
      body1: "لقد بدأت الاستبيان ووصلت إلى خطوة الدفع، لكن العملية لم تكتمل.",
      body2: "بناءً على إجاباتك، سيتم إنشاء تقرير NeuroMap Kids PDF المخصص لك وإرساله عبر البريد الإلكتروني بعد الدفع.",
      cta: "متابعة التقرير",
      reassurance: "لم يتم إجراء أي خصم. ستتابع عبر صفحة دفع آمنة.",
      note: "إذا لم تعد ترغب في المتابعة، فلا يلزمك فعل أي شيء.",
      footer: "NeuroMap Kids"
    },
    pl: {
      subject: "Twój raport NeuroMap Kids nadal czeka",
      preheader: "Twoje odpowiedzi są zapisane. Nadal możesz dokończyć raport.",
      title: "Twój raport nie został jeszcze ukończony",
      greeting: "Cześć",
      body1: "Rozpoczęto kwestionariusz i dotarto do etapu płatności, ale proces nie został ukończony.",
      body2: "Na podstawie Twoich odpowiedzi po płatności zostanie wygenerowany spersonalizowany raport PDF NeuroMap Kids i wysłany e-mailem.",
      cta: "Kontynuuj raport",
      reassurance: "Nie pobrano żadnej opłaty. Kontynuacja odbywa się przez bezpieczną stronę płatności.",
      note: "Jeśli nie chcesz kontynuować, nie musisz nic robić.",
      footer: "NeuroMap Kids"
    },
    pt: {
      subject: "Seu relatório NeuroMap Kids ainda está esperando",
      preheader: "Suas respostas estão salvas. Você ainda pode concluir o relatório.",
      title: "Seu relatório ainda não foi concluído",
      greeting: "Olá",
      body1: "Você iniciou o questionário e chegou à etapa de pagamento, mas o processo não foi concluído.",
      body2: "Com base nas suas respostas, após o pagamento será gerado o seu relatório PDF personalizado NeuroMap Kids e enviado por email.",
      cta: "Continuar relatório",
      reassurance: "Nenhuma cobrança foi realizada. Você continuará por uma página de pagamento segura.",
      note: "Se você não quiser continuar, não precisa fazer mais nada.",
      footer: "NeuroMap Kids"
    },
    fr: {
      subject: "Votre rapport NeuroMap Kids vous attend toujours",
      preheader: "Vos réponses sont enregistrées. Vous pouvez encore finaliser votre rapport.",
      title: "Votre rapport n’est pas encore terminé",
      greeting: "Bonjour",
      body1: "Vous avez commencé le questionnaire et atteint l’étape de paiement, mais le processus n’a pas été terminé.",
      body2: "À partir de vos réponses, votre rapport PDF personnalisé NeuroMap Kids sera généré après paiement et envoyé par email.",
      cta: "Continuer le rapport",
      reassurance: "Aucun montant n’a été débité. Vous continuerez sur une page de paiement sécurisée.",
      note: "Si vous ne souhaitez plus continuer, aucune action n’est nécessaire.",
      footer: "NeuroMap Kids"
    }
  };

  return copy[getSafeLang(lang)] || copy.en;
}

export function buildRecoveryEmail({ lang = "en", name, checkoutUrl }) {
  const safeLang = getSafeLang(lang);
  const t = getRecoveryCopy(safeLang);
  const dir = safeLang === "ar" ? "rtl" : "ltr";
  const align = dir === "rtl" ? "right" : "left";

  const safeName = escapeHtml(String(name || "").trim());
  const safeUrl = escapeHtml(checkoutUrl);
  const greeting = safeName ? `${t.greeting} ${safeName},` : `${t.greeting},`;

  const html = `<!doctype html>
<html lang="${safeLang}" dir="${dir}">
  <body style="margin:0;padding:0;background:#f6fbff;font-family:Arial,sans-serif;color:#1f2937;">
    <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(t.preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6fbff;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:590px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #d7eef9;box-shadow:0 10px 28px rgba(16,24,40,0.06);">
            <tr>
              <td style="height:8px;background:#1197d5;"></td>
            </tr>
            <tr>
              <td style="padding:28px 26px 8px;text-align:${align};">
                <div style="font-size:13px;font-weight:800;color:#0b86bf;margin-bottom:12px;">NeuroMap Kids</div>
                <h1 style="margin:0;color:#1f2937;font-size:25px;line-height:1.25;">${escapeHtml(t.title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 26px 4px;text-align:${align};">
                <p style="font-size:16px;line-height:1.7;margin:0 0 14px;color:#344054;">${escapeHtml(greeting)}</p>
                <p style="font-size:16px;line-height:1.7;margin:0 0 14px;color:#344054;">${escapeHtml(t.body1)}</p>
                <p style="font-size:16px;line-height:1.7;margin:0;color:#344054;">${escapeHtml(t.body2)}</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:28px 26px 18px;">
                <a href="${safeUrl}" style="display:inline-block;background:#1197d5;color:#ffffff;text-decoration:none;border-radius:14px;padding:15px 24px;font-weight:800;font-size:16px;">
                  ${escapeHtml(t.cta)}
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 26px 18px;text-align:${align};">
                <div style="background:#f1faff;border:1px solid #d7eef9;border-radius:16px;padding:14px 16px;color:#475467;font-size:14px;line-height:1.6;">
                  ${escapeHtml(t.reassurance)}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 26px 26px;text-align:${align};">
                <p style="font-size:13px;line-height:1.6;margin:0;color:#667085;">${escapeHtml(t.note)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;background:#f1faff;color:#667085;font-size:12px;text-align:center;">
                ${escapeHtml(t.footer)}
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

${t.body1}

${t.body2}

${t.cta}: ${checkoutUrl}

${t.reassurance}

${t.note}

${t.footer}`;

  return {
    subject: t.subject,
    html,
    text
  };
}