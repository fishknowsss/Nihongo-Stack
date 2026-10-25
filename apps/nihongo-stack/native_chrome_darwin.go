//go:build darwin

package main

import (
	"github.com/ebitengine/purego/objc"
	"github.com/egoist/mygo"
)

// configureMainChrome keeps AppKit's real circular traffic lights in one
// unified toolbar row while preserving the requested content bounds.
func configureMainChrome(window *mygo.Window) {
	mygo.RunOnMain(func() {
		bounds := window.ContentBounds()
		objc.ID(window.NativeHandle()).Send(objc.RegisterName("setToolbarStyle:"), int64(3))
		window.SetContentBounds(bounds)
	})
}
