/**
 * Custom Vite Plugin for injecting Solas Billing Client SDK variables
 */
export default function vitePluginSolas() {
  return {
    name: 'vite-plugin-solas',
    transformIndexHtml(html) {
      return html.replace(
        '</head>',
        `  <meta name="solas-gateway-version" content="1.0.0">\n  </head>`
      );
    }
  };
}
