import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

// مكون لعرض المعادلات الرياضية باستخدام MathJax
export default function MathRenderer({ latex, style, textStyle }) {
  if (!latex || latex.trim() === '') {
    return null;
  }

  // تنظيف LaTeX - إزالة $$ إذا كانت موجودة
  const cleanLatex = latex.replace(/\$\$/g, '').trim();

  // HTML مع MathJax
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <script>
        window.MathJax = {
          tex: {
            inlineMath: [['$', '$']],
            displayMath: [['$$', '$$']],
            processEscapes: true
          },
          startup: {
            pageReady: () => {
              return MathJax.startup.defaultPageReady().then(() => {
                const height = document.body.scrollHeight;
                window.ReactNativeWebView?.postMessage(JSON.stringify({ height }));
              });
            }
          }
        };
      </script>
      <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
      <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Arial', sans-serif;
          font-size: 16px;
          color: #1e3a5f;
          padding: 2px;
          margin: 0;
          direction: rtl;
          text-align: center;
          background: transparent;
          overflow: hidden;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100%;
        }
        .math-container {
          display: inline-block;
          width: auto;
          text-align: center;
          margin: 0;
          padding: 0;
          line-height: 1;
        }
        mjx-container {
          margin: 0 !important;
          padding: 0 !important;
        }
      </style>
    </head>
    <body>
      <div class="math-container">
        $$${cleanLatex}$$
      </div>
    </body>
    </html>
  `;

  const [webViewHeight, setWebViewHeight] = React.useState(40);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.height) {
        setWebViewHeight(data.height + 10);
      }
    } catch (e) {
      console.error('Error parsing WebView message:', e);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <WebView
        source={{ html }}
        style={[styles.webview, { height: webViewHeight }]}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
        scalesPageToFit={false}
        bounces={false}
        androidLayerType="hardware"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  webview: {
    backgroundColor: 'transparent',
    width: '100%',
  },
});
