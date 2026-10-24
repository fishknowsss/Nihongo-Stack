#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use tauri::Manager;

fn main() {
    let context = tauri::generate_context!();
    // QA builds use a named WKWebView data store, never the learner's default store.
    #[cfg(feature = "qa")]
    let context = {
        let mut context = context;
        for window in &mut context.config_mut().app.windows {
            window.data_store_identifier = Some([26, 10, 8, 4, 6, 9, 29, 24, 91, 77, 33, 82, 15, 62, 37, 45]);
        }
        context
    };
    tauri::Builder::default()
        .on_window_event(|window, event| {
            // WKWebView document.hasFocus can remain true after the Mac app loses focus.
            if let tauri::WindowEvent::Focused(focused) = event {
                if let Some(webview) = window.get_webview_window(window.label()) {
                    let script = format!(
                        "window.__NIHONGO_NATIVE_FOCUS__ = {}; window.dispatchEvent(new Event('nihongo-native-focus'));",
                        focused
                    );
                    let _ = webview.eval(&script);
                }
            }
        })
        .run(context)
        .expect("failed to start Nihongo Stack");
}
