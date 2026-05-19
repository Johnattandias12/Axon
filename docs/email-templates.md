# Templates de Email AXON para o Supabase

Copie e cole o código HTML abaixo diretamente no seu painel do **Supabase** (Authentication > Email Templates).
Esses templates seguem a estética dark/lime da AXON.

---

## 1. Confirmação de Cadastro (Signup)

**Subject:** Confirme seu cadastro na AXON

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Confirme seu cadastro na AXON</title>
  </head>
  <body
    style="margin:0;padding:0;background-color:#fafaf7;font-family:-apple-system,BlinkMacSystemFont,'Geist','Inter',sans-serif;color:#0a0a0b;"
  >
    <table
      role="presentation"
      cellpadding="0"
      cellspacing="0"
      border="0"
      width="100%"
      style="background-color:#fafaf7;"
    >
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table
            role="presentation"
            cellpadding="0"
            cellspacing="0"
            border="0"
            width="560"
            style="max-width:560px;width:100%;background-color:#ffffff;border:1px solid #e5e5e0;border-radius:24px;overflow:hidden;"
          >
            <tr>
              <td style="background-color:#0a0a0b;padding:20px 28px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="vertical-align:middle;">
                      <span
                        style="font-size:18px;font-weight:900;letter-spacing:-0.045em;color:#ffffff;"
                        >AXON</span
                      >
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <span
                        style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#c8ff00;"
                      >
                        Boas-vindas
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td
                style="height:3px;background:linear-gradient(90deg,transparent 0%,#c8ff00 50%,transparent 100%);line-height:3px;"
              >
                &nbsp;
              </td>
            </tr>
            <tr>
              <td style="padding:36px 28px 8px;">
                <h1
                  style="margin:0;font-size:26px;line-height:1.18;letter-spacing:-0.03em;font-weight:800;color:#0a0a0b;"
                >
                  Confirme seu e-mail
                </h1>
                <p style="margin:14px 0 0;font-size:14px;line-height:1.6;color:#6b6b70;">
                  Falta pouco para você acessar os melhores eventos. Clique no botão abaixo para
                  ativar sua conta na AXON.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 36px;" align="center">
                <a
                  href="{{ .ConfirmationURL }}"
                  style="display:inline-block;padding:14px 32px;background-color:#c8ff00;color:#0a0a0b;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:-0.01em;border-radius:12px;"
                >
                  Verificar E-mail
                </a>
              </td>
            </tr>
            <tr>
              <td style="background-color:#fafaf7;padding:20px 28px;border-top:1px solid #e5e5e0;">
                <p style="margin:0;font-size:11px;color:#6b6b70;line-height:1.6;">
                  AXON · Ingressos online ·
                  <a href="mailto:suporte@axon.com.br" style="color:#0a0a0b;text-decoration:none;"
                    >suporte@axon.com.br</a
                  >
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

---

## 2. Recuperação de Senha (Reset Password)

**Subject:** Redefinição de senha AXON

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Redefinição de senha AXON</title>
  </head>
  <body
    style="margin:0;padding:0;background-color:#fafaf7;font-family:-apple-system,BlinkMacSystemFont,'Geist','Inter',sans-serif;color:#0a0a0b;"
  >
    <table
      role="presentation"
      cellpadding="0"
      cellspacing="0"
      border="0"
      width="100%"
      style="background-color:#fafaf7;"
    >
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table
            role="presentation"
            cellpadding="0"
            cellspacing="0"
            border="0"
            width="560"
            style="max-width:560px;width:100%;background-color:#ffffff;border:1px solid #e5e5e0;border-radius:24px;overflow:hidden;"
          >
            <tr>
              <td style="background-color:#0a0a0b;padding:20px 28px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="vertical-align:middle;">
                      <span
                        style="font-size:18px;font-weight:900;letter-spacing:-0.045em;color:#ffffff;"
                        >AXON</span
                      >
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <span
                        style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#c8ff00;"
                      >
                        Segurança
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td
                style="height:3px;background:linear-gradient(90deg,transparent 0%,#c8ff00 50%,transparent 100%);line-height:3px;"
              >
                &nbsp;
              </td>
            </tr>
            <tr>
              <td style="padding:36px 28px 8px;">
                <h1
                  style="margin:0;font-size:26px;line-height:1.18;letter-spacing:-0.03em;font-weight:800;color:#0a0a0b;"
                >
                  Redefinir Senha
                </h1>
                <p style="margin:14px 0 0;font-size:14px;line-height:1.6;color:#6b6b70;">
                  Recebemos um pedido para alterar a senha da sua conta. Se foi você, clique no
                  botão abaixo para criar uma nova.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 12px;" align="center">
                <a
                  href="{{ .ConfirmationURL }}"
                  style="display:inline-block;padding:14px 32px;background-color:#c8ff00;color:#0a0a0b;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:-0.01em;border-radius:12px;"
                >
                  Criar nova senha
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 36px;" align="center">
                <p style="margin:0;font-size:12px;color:#6b6b70;">
                  Se não foi você, ignore este e-mail. O link expira em 24 horas.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#fafaf7;padding:20px 28px;border-top:1px solid #e5e5e0;">
                <p style="margin:0;font-size:11px;color:#6b6b70;line-height:1.6;">
                  AXON · Ingressos online ·
                  <a href="mailto:suporte@axon.com.br" style="color:#0a0a0b;text-decoration:none;"
                    >suporte@axon.com.br</a
                  >
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

---

## 3. Convite de Conta (Invite)

**Subject:** Você foi convidado para a AXON

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Convite para a AXON</title>
  </head>
  <body
    style="margin:0;padding:0;background-color:#fafaf7;font-family:-apple-system,BlinkMacSystemFont,'Geist','Inter',sans-serif;color:#0a0a0b;"
  >
    <table
      role="presentation"
      cellpadding="0"
      cellspacing="0"
      border="0"
      width="100%"
      style="background-color:#fafaf7;"
    >
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table
            role="presentation"
            cellpadding="0"
            cellspacing="0"
            border="0"
            width="560"
            style="max-width:560px;width:100%;background-color:#ffffff;border:1px solid #e5e5e0;border-radius:24px;overflow:hidden;"
          >
            <tr>
              <td style="background-color:#0a0a0b;padding:20px 28px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="vertical-align:middle;">
                      <span
                        style="font-size:18px;font-weight:900;letter-spacing:-0.045em;color:#ffffff;"
                        >AXON</span
                      >
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <span
                        style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#c8ff00;"
                      >
                        Convite
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td
                style="height:3px;background:linear-gradient(90deg,transparent 0%,#c8ff00 50%,transparent 100%);line-height:3px;"
              >
                &nbsp;
              </td>
            </tr>
            <tr>
              <td style="padding:36px 28px 8px;">
                <h1
                  style="margin:0;font-size:26px;line-height:1.18;letter-spacing:-0.03em;font-weight:800;color:#0a0a0b;"
                >
                  Você foi convidado!
                </h1>
                <p style="margin:14px 0 0;font-size:14px;line-height:1.6;color:#6b6b70;">
                  Alguém te convidou para se juntar à AXON. Aceite o convite abaixo para criar sua
                  conta e participar.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 36px;" align="center">
                <a
                  href="{{ .ConfirmationURL }}"
                  style="display:inline-block;padding:14px 32px;background-color:#c8ff00;color:#0a0a0b;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:-0.01em;border-radius:12px;"
                >
                  Aceitar convite
                </a>
              </td>
            </tr>
            <tr>
              <td style="background-color:#fafaf7;padding:20px 28px;border-top:1px solid #e5e5e0;">
                <p style="margin:0;font-size:11px;color:#6b6b70;line-height:1.6;">
                  AXON · Ingressos online ·
                  <a href="mailto:suporte@axon.com.br" style="color:#0a0a0b;text-decoration:none;"
                    >suporte@axon.com.br</a
                  >
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```
