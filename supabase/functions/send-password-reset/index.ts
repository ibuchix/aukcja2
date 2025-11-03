import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetEmailRequest {
  email: string;
  token: string;
  dealershipName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, token, dealershipName }: PasswordResetEmailRequest = await req.json();

    if (!email || !token) {
      return new Response(
        JSON.stringify({ error: "Email and token are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resetUrl = `https://aukcja.autaro.pl/reset-password?token=${token}`;

    const emailResponse = await resend.emails.send({
      from: "Auto Trader <powiadomienia@autaro.pl>",
      to: [email],
      subject: "Resetowanie hasła konta dealera Autaro.pl",
      html: `
        <!DOCTYPE html>
        <html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
        <head>
          <meta charset="UTF-8" />
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
          <!--[if !mso]><!-- -->
          <meta http-equiv="X-UA-Compatible" content="IE=edge" />
          <!--<![endif]-->
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
          <meta name="x-apple-disable-message-reformatting" />
          <link href="https://fonts.googleapis.com/css?family=Heebo:ital,wght@0,400;0,500" rel="stylesheet" />
          <link href="https://fonts.googleapis.com/css?family=Inter:ital,wght@0,400;0,500;0,700" rel="stylesheet" />
          <title>Resetowanie hasła konta dealera Autaro.pl</title>
          <style>
            html, body { margin: 0 !important; padding: 0 !important; min-height: 100% !important; width: 100% !important; -webkit-font-smoothing: antialiased; }
            * { -ms-text-size-adjust: 100%; }
            #outlook a { padding: 0; }
            .ReadMsgBody, .ExternalClass { width: 100%; }
            .ExternalClass, .ExternalClass p, .ExternalClass td, .ExternalClass div, .ExternalClass span, .ExternalClass font { line-height: 100%; }
            table, td, th { mso-table-lspace: 0 !important; mso-table-rspace: 0 !important; border-collapse: collapse; }
            u + .body table, u + .body td, u + .body th { will-change: transform; }
            body, td, th, p, div, li, a, span { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; mso-line-height-rule: exactly; }
            img { border: 0; outline: 0; line-height: 100%; text-decoration: none; -ms-interpolation-mode: bicubic; }
            a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
            .body .pc-project-body { background-color: transparent !important; }
            @media (min-width: 621px) { .pc-lg-hide { display: none; } .pc-lg-bg-img-hide { background-image: none !important; } }
            @media (max-width: 620px) {
              .pc-project-body {min-width: 0px !important;} .pc-project-container, .pc-component {width: 100% !important;}
              .pc-sm-hide {display: none !important;} .pc-sm-bg-img-hide {background-image: none !important;}
              .pc-w620-padding-0-0-0-0 {padding: 0px 0px 0px 0px !important;} .pc-w620-padding-10-35-10-35 {padding: 10px 35px 10px 35px !important;}
              .pc-w620-font-size-58px {font-size: 58px !important;} .pc-w620-padding-60-20-10-20 {padding: 60px 20px 10px 20px !important;}
              table.pc-w620-spacing-0-0-0-0 {margin: 0px 0px 0px 0px !important;}
              td.pc-w620-spacing-0-0-0-0,th.pc-w620-spacing-0-0-0-0{margin: 0 !important;padding: 0px 0px 0px 0px !important;}
              .pc-w620-itemsVSpacings-40 {padding-top: 20px !important;padding-bottom: 20px !important;}
              .pc-w620-itemsHSpacings-40 {padding-left: 20px !important;padding-right: 20px !important;}
              .pc-w620-padding-35-35-35-35 {padding: 35px 35px 35px 35px !important;}
              .pc-w620-itemsVSpacings-20 {padding-top: 10px !important;padding-bottom: 10px !important;}
              .pc-w620-itemsHSpacings-0 {padding-left: 0px !important;padding-right: 0px !important;}
              table.pc-w620-spacing-0-20-20-20 {margin: 0px 20px 20px 20px !important;}
              td.pc-w620-spacing-0-20-20-20,th.pc-w620-spacing-0-20-20-20{margin: 0 !important;padding: 0px 20px 20px 20px !important;}
              .pc-w620-valign-top {vertical-align: top !important;} td.pc-w620-halign-center,th.pc-w620-halign-center {text-align: center !important;text-align-last: center !important;}
              table.pc-w620-halign-center {float: none !important;margin-right: auto !important;margin-left: auto !important;}
              img.pc-w620-halign-center {margin-right: auto !important;margin-left: auto !important;}
              .pc-w620-itemsVSpacings-0 {padding-top: 0px !important;padding-bottom: 0px !important;}
              .pc-w620-itemsHSpacings-20 {padding-left: 10px !important;padding-right: 10px !important;}
              div.pc-w620-align-right,th.pc-w620-align-right,a.pc-w620-align-right,td.pc-w620-align-right {text-align: right !important;text-align-last: right !important;}
              table.pc-w620-align-right{float: none !important;margin-left: auto !important;margin-right: 0 !important;}
              img.pc-w620-align-right{margin-right: 0 !important;margin-left: auto !important;}
              .pc-w620-text-align-center {text-align: center !important;text-align-last: center !important;}
              .pc-w620-padding-32-0-0-0 {padding: 32px 0px 0px 0px !important;} .pc-g-ib{display: inline-block !important;}
              .pc-g-b{display: block !important;} .pc-g-rb{display: block !important;width: auto !important;} .pc-g-wf{width: 100% !important;}
              .pc-g-rpt{padding-top: 0 !important;} .pc-g-rpr{padding-right: 0 !important;} .pc-g-rpb{padding-bottom: 0 !important;} .pc-g-rpl{padding-left: 0 !important;}
            }
            @media (max-width: 520px) { .pc-w520-padding-10-30-10-30 {padding: 10px 30px 10px 30px !important;} .pc-w520-padding-30-30-30-30 {padding: 30px 30px 30px 30px !important;} }
            @font-face { font-family: 'Heebo'; font-style: normal; font-weight: 400; src: url('https://fonts.gstatic.com/s/heebo/v26/NGSpv5_NC0k9P_v6ZUCbLRAHxK1EiSyse0mg.woff') format('woff'), url('https://fonts.gstatic.com/s/heebo/v26/NGSpv5_NC0k9P_v6ZUCbLRAHxK1EiSyse0mm.woff2') format('woff2'); }
            @font-face { font-family: 'Heebo'; font-style: normal; font-weight: 500; src: url('https://fonts.gstatic.com/s/heebo/v26/NGSpv5_NC0k9P_v6ZUCbLRAHxK1Euyyse0mg.woff') format('woff'), url('https://fonts.gstatic.com/s/heebo/v26/NGSpv5_NC0k9P_v6ZUCbLRAHxK1Euyyse0mm.woff2') format('woff2'); }
            @font-face { font-family: 'Inter'; font-style: normal; font-weight: 500; src: url('https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZFhjg.woff') format('woff'), url('https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZFhiA.woff2') format('woff2'); }
            @font-face { font-family: 'Inter'; font-style: normal; font-weight: 400; src: url('https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZFhjg.woff') format('woff'), url('https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZFhiA.woff2') format('woff2'); }
            @font-face { font-family: 'Inter'; font-style: normal; font-weight: 700; src: url('https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZFhjg.woff') format('woff'), url('https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZFhiA.woff2') format('woff2'); }
          </style>
        </head>
        <body class="body pc-font-alt" style="width: 100% !important; min-height: 100% !important; margin: 0 !important; padding: 0 !important; font-weight: normal; color: #2D3A41; mso-line-height-rule: exactly; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; font-variant-ligatures: normal; text-rendering: optimizeLegibility; -moz-osx-font-smoothing: grayscale; background-color: #ffffff;" bgcolor="#ffffff">
          <table class="pc-project-body" style="table-layout: fixed; width: 100%; min-width: 600px; background-color: #ffffff;" bgcolor="#ffffff" border="0" cellspacing="0" cellpadding="0" role="presentation">
            <tr>
              <td align="center" valign="top" style="width:auto;">
                <table class="pc-project-container" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td class="pc-w620-padding-0-0-0-0" style="padding: 20px 0px 20px 0px;" align="left" valign="top">
                      <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                        <tr>
                          <td valign="top">
                            <table class="pc-component" style="width: 600px; max-width: 600px;" width="600" align="center" border="0" cellspacing="0" cellpadding="0" role="presentation">
                              <tr>
                                <td valign="top" class="pc-w520-padding-10-30-10-30 pc-w620-padding-10-35-10-35" style="height: unset; background-color: #ffffff;" bgcolor="#ffffff">
                                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                    <tr>
                                      <td valign="top" align="left">
                                        <div class="pc-font-alt" style="text-decoration: none;">
                                          <div style="font-size:1px;line-height:160%;text-align:left;text-align-last:left;color:#00000000;font-family:'Heebo', Arial, Helvetica, sans-serif;font-style:normal;letter-spacing:0px;">
                                            <div style="font-family:'Heebo', Arial, Helvetica, sans-serif;"><span style="font-family: 'Heebo', Arial, Helvetica, sans-serif; font-weight: 400; font-size: 1px; line-height: 160%;">Otrzymaliśmy prośbę o zresetowanie hasła do konta dealera na Autaro.pl</span></div>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td valign="top">
                            <table width="600" border="0" cellspacing="0" cellpadding="0" role="presentation" align="center" class="pc-component" style="width: 600px; max-width: 600px;">
                              <tr>
                                <td class="pc-w620-spacing-0-0-0-0" width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
                                  <table width="100%" align="center" border="0" cellspacing="0" cellpadding="0" role="presentation">
                                    <tr>
                                      <td valign="top" class="pc-w620-padding-60-20-10-20" style="padding: 20px 40px 20px 40px; height: unset; background-color: transparent;" bgcolor="transparent">
                                        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                          <tr>
                                            <td valign="top" style="padding: 0px 0px 60px 0px; height: auto;">
                                              <a class="pc-font-alt" href="https://aukcja.autaro.pl" target="_blank" style="text-decoration: none; display: inline-block; vertical-align: top;">
                                                <img src="https://postcards-cdn.designmodo.com/images-cdn/Color_logo_-_no_background_2-85baa024.png" width="250" height="60" alt="Autaro.pl" style="display: block; outline: 0; line-height: 100%; -ms-interpolation-mode: bicubic; width: 250px; height: auto; max-width: 100%; border: 0;" />
                                              </a>
                                            </td>
                                          </tr>
                                        </table>
                                        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                          <tr>
                                            <td align="left" valign="top" style="padding: 0px 0px 40px 0px; height: auto;">
                                              <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                                <tr>
                                                  <td valign="top" align="left">
                                                    <div class="pc-font-alt" style="text-decoration: none;">
                                                      <div class="pc-w620-font-size-58px" style="font-size:45px;line-height:107%;text-align:left;text-align-last:left;color:#454545;font-family:'Heebo', Arial, Helvetica, sans-serif;letter-spacing:-0.2px;font-style:normal;">
                                                        <div style="font-family:'Heebo', Arial, Helvetica, sans-serif;"><span style="font-family: 'Heebo', Arial, Helvetica, sans-serif; font-size: 45px; line-height: 107%; font-weight: 500;" class="pc-w620-font-size-58px">Reset hasła konta dealera</span></div>
                                                      </div>
                                                    </div>
                                                  </td>
                                                </tr>
                                              </table>
                                            </td>
                                          </tr>
                                        </table>
                                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                          <tr>
                                            <td valign="top" align="left">
                                              <div class="pc-font-alt" style="text-decoration: none;">
                                                <div style="font-size:16px;line-height:160%;text-align:left;text-align-last:left;color:#454545;font-family:'Heebo', Arial, Helvetica, sans-serif;font-style:normal;letter-spacing:0px;">
                                                  <div style="font-family:'Heebo', Arial, Helvetica, sans-serif;"><span style="font-family: 'Heebo', Arial, Helvetica, sans-serif; font-weight: 400; font-size: 16px; line-height: 160%;">Otrzymaliśmy prośbę o zresetowanie hasła do konta dealera na Autaro.pl.</span></div>
                                                  <div><br></div>
                                                  <div style="font-family:'Heebo', Arial, Helvetica, sans-serif;"><span style="font-family: 'Heebo', Arial, Helvetica, sans-serif; font-weight: 400; font-size: 16px; line-height: 160%;">Aby ustawić nowe hasło, kliknij poniższy przycisk:</span></div>
                                                </div>
                                              </div>
                                            </td>
                                          </tr>
                                        </table>
                                        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                          <tr>
                                            <td align="center" style="padding: 30px 0 20px 0;">
                                              <a href="${resetUrl}" style="display: inline-block; background-color: #D81B24; color: #FCFCFC; text-decoration: none; padding: 16px 48px; border-radius: 4px; font-size: 16px; font-weight: 500; font-family: 'Heebo', Arial, Helvetica, sans-serif;">Zresetuj hasło</a>
                                            </td>
                                          </tr>
                                        </table>
                                        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                          <tr>
                                            <td align="left" style="padding: 10px 0 0 0;">
                                              <div class="pc-font-alt" style="text-decoration: none;">
                                                <div style="font-size:14px;line-height:160%;color:#454545;font-family:'Heebo', Arial, Helvetica, sans-serif;">
                                                  <div><span style="font-weight: 400; font-size: 14px;">Lub skopiuj i wklej ten link w przeglądarce:</span></div>
                                                  <div style="padding-top: 10px;"><span style="font-weight: 400; font-size: 14px; color: #666; word-break: break-all;">${resetUrl}</span></div>
                                                </div>
                                              </div>
                                            </td>
                                          </tr>
                                        </table>
                                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="padding-top: 20px;">
                                          <tr>
                                            <td valign="top" align="left">
                                              <div class="pc-font-alt" style="text-decoration: none;">
                                                <div style="font-size:16px;line-height:160%;text-align:left;text-align-last:left;color:#454545;font-family:'Heebo', Arial, Helvetica, sans-serif;font-style:normal;letter-spacing:0px;">
                                                  <div style="font-family:'Heebo', Arial, Helvetica, sans-serif;"><span style="font-family: 'Heebo', Arial, Helvetica, sans-serif; font-weight: 400; font-size: 16px; line-height: 160%;">Jeśli ta prośba nie została wysłana przez Ciebie, zignoruj tę wiadomość – Twoje hasło pozostanie bez zmian.</span></div>
                                                  <div><br></div>
                                                  <div style="font-family:'Heebo', Arial, Helvetica, sans-serif;"><span style="font-family: 'Heebo', Arial, Helvetica, sans-serif; font-weight: 400; font-size: 16px; line-height: 160%;">W razie pytań prosimy o kontakt mailowy lub telefoniczny pod numerem </span></div>
                                                  <div style="font-family:'Heebo', Arial, Helvetica, sans-serif;"><span style="font-family: 'Heebo', Arial, Helvetica, sans-serif; font-weight: 400; font-size: 16px; line-height: 160%;">+48 459 567 877 i nasz zespół chętnie pomoże w każdej sprawie.</span></div>
                                                  <div><br></div>
                                                  <div style="font-family:'Heebo', Arial, Helvetica, sans-serif;"><span style="font-family: 'Heebo', Arial, Helvetica, sans-serif; font-weight: 400; font-size: 16px; line-height: 160%;">Pozdrawiamy,</span></div>
                                                  <div><br></div>
                                                  <div style="font-family:'Heebo', Arial, Helvetica, sans-serif;"><span style="font-family: 'Heebo', Arial, Helvetica, sans-serif; font-weight: 500; font-size: 16px; line-height: 160%;">Zespół Dealera Autaro.pl</span></div>
                                                  <div style="font-family:'Heebo', Arial, Helvetica, sans-serif;"><span style="font-family: 'Heebo', Arial, Helvetica, sans-serif; font-weight: 500; font-size: 16px; line-height: 160%;">☎️ +48 459 567 877</span></div>
                                                  <div style="font-family:'Heebo', Arial, Helvetica, sans-serif;"><span style="font-family: 'Heebo', Arial, Helvetica, sans-serif; font-weight: 500; font-size: 16px; line-height: 160%;">💻 https://aukcja.autaro.pl</span></div>
                                                </div>
                                              </div>
                                            </td>
                                          </tr>
                                        </table>
                                        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                          <tr>
                                            <td valign="top" style="padding: 40px 0px 40px 0px;">
                                              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" align="center" style="margin: auto;">
                                                <tr>
                                                  <td valign="top" style="line-height: 1px; font-size: 1px; border-bottom: 1px solid #454545;">&nbsp;</td>
                                                </tr>
                                              </table>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td valign="top">
                            <table class="pc-component" style="width: 600px; max-width: 600px;" width="600" align="center" border="0" cellspacing="0" cellpadding="0" role="presentation">
                              <tr>
                                <td valign="top" class="pc-w520-padding-30-30-30-30 pc-w620-padding-35-35-35-35" style="padding: 10px 40px 10px 40px; height: unset; background-color: #ffffff;" bgcolor="#ffffff">
                                  <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                    <tr>
                                      <td align="center" valign="top" style="padding: 0px 0px 10px 0px; height: auto;">
                                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin-right: auto; margin-left: auto;">
                                          <tr>
                                            <td valign="top" align="center" style="padding: 0px 20px 0px 20px; height: auto;">
                                              <div class="pc-font-alt" style="text-decoration: none;">
                                                <div style="font-size:32px;line-height:42px;text-align:center;text-align-last:center;color:#454545;font-family:'Inter', Arial, Helvetica, sans-serif;letter-spacing:-0.2px;font-style:normal;">
                                                  <div style="font-family:'Inter', Arial, Helvetica, sans-serif;"><span style="font-family: 'Inter', Arial, Helvetica, sans-serif; font-size: 32px; line-height: 42px; font-weight: 700;">Nasi Partnerzy</span></div>
                                                </div>
                                              </div>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table>
                                  <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                    <tr>
                                      <td align="center" valign="top" style="padding: 0px 0px 40px 0px; height: auto;">
                                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin-right: auto; margin-left: auto;">
                                          <tr>
                                            <td valign="top" align="center">
                                              <div class="pc-font-alt" style="text-decoration: none;">
                                                <div style="font-size:14px;line-height:20px;text-align:center;text-align-last:center;color:#454545;font-family:'Inter', Arial, Helvetica, sans-serif;letter-spacing:-0.2px;font-style:normal;">
                                                  <div style="font-family:'Inter', Arial, Helvetica, sans-serif;"><span style="font-family: 'Inter', Arial, Helvetica, sans-serif; font-size: 14px; line-height: 20px; font-weight: 500;">Nasza współpraca z CarVertical i Autobaza pozwala na wykupienie raportu historii na naszej aukcji.</span></div>
                                                </div>
                                              </div>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table>
                                  <table class="pc-width-fill pc-g-b" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                    <tbody class="pc-g-b">
                                      <tr class="pc-g-ib pc-g-wf">
                                        <td class="pc-g-rb pc-g-rpt pc-g-wf pc-w620-itemsVSpacings-40" align="center" valign="middle" style="width: 50%; padding-top: 0px; padding-bottom: 0px;">
                                          <table style="width: 100%;" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                            <tr>
                                              <td align="center" valign="middle">
                                                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                  <tr>
                                                    <td align="center" valign="top" style="line-height: 1px; font-size: 1px;">
                                                      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                        <tr>
                                                          <td align="center" valign="top">
                                                            <img src="https://postcards-cdn.designmodo.com/images-cdn/CV_LOGO_BLUE-100de287.png" width="200" height="28" alt="CarVertical" style="display: block; outline: 0; line-height: 100%; -ms-interpolation-mode: bicubic; width: 200px; height: auto; max-width: 100%; border: 0;" />
                                                          </td>
                                                        </tr>
                                                      </table>
                                                    </td>
                                                  </tr>
                                                </table>
                                              </td>
                                            </tr>
                                          </table>
                                        </td>
                                        <td class="pc-w620-itemsHSpacings-40" valign="middle" style="padding-right: 20px; padding-left: 20px;" />
                                        <td class="pc-g-rb pc-g-rpb pc-g-wf pc-w620-itemsVSpacings-40" align="center" valign="middle" style="width: 50%; padding-top: 0px; padding-bottom: 0px;">
                                          <table style="width: 100%;" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                            <tr>
                                              <td align="center" valign="middle">
                                                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                  <tr>
                                                    <td align="center" valign="top" style="line-height: 1px; font-size: 1px;">
                                                      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                        <tr>
                                                          <td align="center" valign="top">
                                                            <img src="https://postcards-cdn.designmodo.com/images-cdn/autobaza_logo-2f75d44e.png" width="200" height="57" alt="Autobaza" style="display: block; outline: 0; line-height: 100%; -ms-interpolation-mode: bicubic; width: 200px; height: auto; max-width: 100%; border: 0;" />
                                                          </td>
                                                        </tr>
                                                      </table>
                                                    </td>
                                                  </tr>
                                                </table>
                                              </td>
                                            </tr>
                                          </table>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td valign="top">
                            <table width="600" border="0" cellspacing="0" cellpadding="0" role="presentation" align="center" class="pc-component" style="width: 600px; max-width: 600px;">
                              <tr>
                                <td class="pc-w620-spacing-0-0-0-0" width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
                                  <table style="border-collapse: separate; border-spacing: 0px;" width="100%" align="center" border="0" cellspacing="0" cellpadding="0" role="presentation">
                                    <tr>
                                      <td valign="top" class="pc-w620-padding-32-0-0-0" style="padding: 64px 0px 0px 0px; height: unset; border-top: 1px solid #515151; background-color: #ffffff;" bgcolor="#ffffff">
                                        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                          <tr>
                                            <td class="pc-w620-spacing-0-20-20-20 pc-w620-valign-top pc-w620-halign-center" style="padding: 0px 32px 62px 32px;">
                                              <table class="pc-width-fill pc-g-b pc-w620-halign-center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                <tbody class="pc-g-b">
                                                  <tr class="pc-g-ib pc-g-wf">
                                                    <td class="pc-g-rb pc-g-rpt pc-g-rpb pc-g-wf pc-w620-itemsVSpacings-20" align="left" valign="middle" style="width: 100%; padding-top: 0px; padding-bottom: 0px;">
                                                      <table class="pc-w620-halign-center" style="width: 100%;" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                        <tr>
                                                          <td class="pc-w620-halign-center pc-w620-valign-top" align="center" valign="middle">
                                                            <table class="pc-w620-halign-center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                              <tr>
                                                                <td class="pc-w620-halign-center" align="center" valign="top">
                                                                  <table class="pc-w620-halign-center" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                                    <tr>
                                                                      <td class="pc-w620-valign-top pc-w620-halign-center" align="center">
                                                                        <table class="pc-width-hug pc-w620-halign-center" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                                          <tbody>
                                                                            <tr>
                                                                              <td class="pc-g-rpt pc-g-rpb pc-w620-itemsVSpacings-0" valign="middle" style="width: 33.33%; padding-top: 0px; padding-bottom: 0px;">
                                                                                <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                                                  <tr>
                                                                                    <td class="pc-w620-halign-center pc-w620-valign-top" align="center" valign="middle">
                                                                                      <table class="pc-w620-halign-center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                                                        <tr>
                                                                                          <td class="pc-w620-halign-center" align="center" valign="top" style="line-height: 1px; font-size: 1px;">
                                                                                            <a class="pc-font-alt" href="https://www.instagram.com/autaro.pl?igsh=cWJsdmw3MjQzM2h6" target="_blank" style="text-decoration: none; display: inline-block; vertical-align: top;">
                                                                                              <img src="https://postcards-cdn.designmodo.com/images-cdn/5824fa1145af8c65daf7d1711c7c1a11.png" class="" width="20" height="20" style="display: block; border: 0; outline: 0; line-height: 100%; -ms-interpolation-mode: bicubic; width: 20px; height: 20px;" alt="Instagram" />
                                                                                            </a>
                                                                                          </td>
                                                                                        </tr>
                                                                                      </table>
                                                                                    </td>
                                                                                  </tr>
                                                                                </table>
                                                                              </td>
                                                                              <td class="pc-w620-itemsHSpacings-20" valign="middle" style="padding-right: 10px; padding-left: 10px;" />
                                                                              <td class="pc-g-rpt pc-g-rpb pc-w620-itemsVSpacings-0" valign="middle" style="width: 33.33%; padding-top: 0px; padding-bottom: 0px;">
                                                                                <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                                                  <tr>
                                                                                    <td class="pc-w620-halign-center pc-w620-valign-top" align="center" valign="middle">
                                                                                      <table class="pc-w620-halign-center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                                                        <tr>
                                                                                          <td class="pc-w620-halign-center" align="center" valign="top" style="line-height: 1px; font-size: 1px;">
                                                                                            <a class="pc-font-alt" href="https://www.facebook.com/share/1FtEdJoydU/?mibextid=wwXIfr" target="_blank" style="text-decoration: none; display: inline-block; vertical-align: top;">
                                                                                              <img src="https://postcards-cdn.designmodo.com/images-cdn/6b9792335937bf7bdc7f02a4cc5cfaf0.png" class="" width="20" height="20" style="display: block; border: 0; outline: 0; line-height: 100%; -ms-interpolation-mode: bicubic; width: 20px; height: 20px;" alt="Facebook" />
                                                                                            </a>
                                                                                          </td>
                                                                                        </tr>
                                                                                      </table>
                                                                                    </td>
                                                                                  </tr>
                                                                                </table>
                                                                              </td>
                                                                              <td class="pc-w620-itemsHSpacings-20" valign="middle" style="padding-right: 10px; padding-left: 10px;" />
                                                                              <td class="pc-g-rpt pc-g-rpb pc-w620-itemsVSpacings-0" valign="middle" style="width: 33.33%; padding-top: 0px; padding-bottom: 0px;">
                                                                                <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                                                  <tr>
                                                                                    <td class="pc-w620-halign-center pc-w620-valign-top" align="center" valign="middle">
                                                                                      <table class="pc-w620-halign-center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                                                        <tr>
                                                                                          <td class="pc-w620-halign-center" align="center" valign="top" style="line-height: 1px; font-size: 1px;">
                                                                                            <a class="pc-font-alt" href="https://www.tiktok.com/@autaro.pl_?_t=ZN-901Ze5hU79i&_r=1" target="_blank" style="text-decoration: none; display: inline-block; vertical-align: top;">
                                                                                              <img src="https://postcards-cdn.designmodo.com/images-cdn/2af904415ed6d2a464ea4a319c5271f5.png" class="" width="20" height="20" style="display: block; border: 0; outline: 0; line-height: 100%; -ms-interpolation-mode: bicubic; width: 20px; height: 20px;" alt="TikTok" />
                                                                                            </a>
                                                                                          </td>
                                                                                        </tr>
                                                                                      </table>
                                                                                    </td>
                                                                                  </tr>
                                                                                </table>
                                                                              </td>
                                                                            </tr>
                                                                          </tbody>
                                                                        </table>
                                                                      </td>
                                                                    </tr>
                                                                  </table>
                                                                </td>
                                                              </tr>
                                                            </table>
                                                          </td>
                                                        </tr>
                                                      </table>
                                                    </td>
                                                  </tr>
                                                </tbody>
                                              </table>
                                            </td>
                                          </tr>
                                        </table>
                                        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                          <tr>
                                            <td class="pc-w620-align-right" align="left" valign="top" style="padding: 0px 30px 39px 30px; height: auto;">
                                              <table border="0" cellpadding="0" cellspacing="0" role="presentation" class="pc-w620-align-right" width="100%" style="margin-right: auto; margin-left: auto;">
                                                <tr>
                                                  <td valign="top" class="pc-w620-align-right" align="center">
                                                    <div class="pc-font-alt pc-w620-align-right" style="text-decoration: none;">
                                                      <div style="font-size:14px;line-height:20px;text-align:center;text-align-last:center;color:#454545;font-family:'Inter', Arial, Helvetica, sans-serif;font-style:normal;letter-spacing:0px;">
                                                        <div style="font-family:'Inter', Arial, Helvetica, sans-serif;" class="pc-w620-text-align-center"><span style="font-family: 'Inter', Arial, Helvetica, sans-serif; font-weight: 400; font-size: 14px; line-height: 20px;">To jest automatyczna wiadomość, prosimy nie odpowiadać na ten e-mail.</span></div>
                                                      </div>
                                                    </div>
                                                  </td>
                                                </tr>
                                              </table>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending password reset email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
