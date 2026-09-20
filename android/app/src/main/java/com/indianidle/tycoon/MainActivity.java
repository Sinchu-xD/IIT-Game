package com.indianidle.tycoon;

import android.app.Activity;
import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private FrameLayout container;
    private long lastBackPress = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Fullscreen immersive
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        Window window = getWindow();
        window.setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN);
        window.setStatusBarColor(Color.BLACK);
        window.getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);

        container = new FrameLayout(this);
        setContentView(container);

        webView = new WebView(this);
        setupWebView();
        container.addView(webView);

        // Load local assets
        webView.loadUrl("file:///android_asset/index.html");
    }

    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setDefaultTextEncodingName("utf-8");
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        // Add JavaScript interface for native lifecycle events
        webView.addJavascriptInterface(new GameBridge(), "AndroidNative");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                // Block all external navigation - game is fully offline
                if (url.startsWith("file:///android_asset/")) {
                    return false;
                }
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
            }
        });

        webView.setWebChromeClient(new WebChromeClient());

        // Hardware acceleration for smooth WebGL
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
    }

    // Bridge class - sends native events to JavaScript
    public class GameBridge {
        @android.webkit.JavascriptInterface
        public void onPause() {
            runOnUiThread(() -> {
                if (webView != null) {
                    webView.evaluateJavascript("if(typeof dispatchPause==='function')dispatchPause();", null);
                }
            });
        }

        @android.webkit.JavascriptInterface
        public void onResume() {
            runOnUiThread(() -> {
                if (webView != null) {
                    webView.evaluateJavascript("if(typeof dispatchResume==='function')dispatchResume();", null);
                }
            });
        }

        @android.webkit.JavascriptInterface
        public void onBackPressed() {
            runOnUiThread(() -> {
                if (webView != null) {
                    webView.evaluateJavascript("if(typeof dispatchBack==='function')dispatchBack();", null);
                }
            });
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
    }

    @Override
    protected void onPause() {
        if (webView != null) {
            webView.evaluateJavascript("if(typeof dispatchPause==='function')dispatchPause();", null);
            webView.onPause();
        }
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.evaluateJavascript("if(typeof dispatchPause==='function')dispatchPause();", null);
            container.removeView(webView);
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            if (webView != null) {
                webView.evaluateJavascript("if(typeof dispatchBack==='function')dispatchBack();", null);
            }
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
