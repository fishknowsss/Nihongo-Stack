package main

import (
	"fmt"
	"log"

	"github.com/egoist/mygo"
)

const focusScript = "window.__NIHONGO_NATIVE_FOCUS__ = %t; window.dispatchEvent(new Event('nihongo-native-focus'));"

func setNativeFocus(window *mygo.Window, focused bool) {
	if window.Page() == nil {
		return
	}
	_, _ = window.Page().Eval(fmt.Sprintf(focusScript, focused))
}

func main() {
	// The product currently has one light interface. Keep AppKit chrome on the
	// same appearance instead of letting system Dark Mode restyle it alone.
	mygo.Theme.SetSource(mygo.ThemeLight)

	mygo.App.WhenReady(func() {
		window := mygo.NewWindow(mygo.WindowOptions{
			Title:                "Nihongo Stack",
			Width:                1380,
			Height:               900,
			UseContentSize:       true,
			MinWidth:             900,
			MinHeight:            680,
			BackgroundColor:      "#f4f2ed",
			TitleBarStyle:        mygo.TitleBarHidden,
			TrafficLightPosition: &mygo.Point{X: 24, Y: 19},
			StateKey:             "main",
			URL:                  "/",
			Hidden:               true,
		})
		window.OnReadyToShow(func() {
			setNativeFocus(window, true)
			window.Show()
		})
		window.OnFocus(func() { setNativeFocus(window, true) })
		window.OnBlur(func() { setNativeFocus(window, false) })
	})

	if err := mygo.App.Run(); err != nil {
		log.Fatal(err)
	}
}
