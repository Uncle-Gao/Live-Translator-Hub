import Foundation
import AppKit
import CoreGraphics

let args = CommandLine.arguments
guard args.count >= 3 else { print("Usage: round-icon input.png output.png [padding%]"); exit(1) }

guard let src = NSImage(contentsOfFile: args[1]),
      let cgSrc = src.cgImage(forProposedRect: nil, context: nil, hints: nil)
else { print("Cannot load \(args[1])"); exit(1) }

let paddingFraction = CGFloat((args.count >= 4 ? Double(args[3]) : nil) ?? 10.0) / 100.0

// Fixed 1024×1024 output (largest size needed for iconset)
let px = 1024
let size = CGFloat(px)
let padding = size * paddingFraction
let radius = size * 0.2237   // macOS squircle

// Create RGBA bitmap context with alpha
let ctx = CGContext(
    data: nil, width: px, height: px,
    bitsPerComponent: 8, bytesPerRow: 0,
    space: CGColorSpaceCreateDeviceRGB(),
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
)!

// Transparent background
ctx.clear(CGRect(x: 0, y: 0, width: size, height: size))

// Clip to squircle
let squircle = CGPath(roundedRect: CGRect(x: 0, y: 0, width: size, height: size),
                      cornerWidth: radius, cornerHeight: radius, transform: nil)
ctx.addPath(squircle)
ctx.clip()

// Draw source image scaled into padded area (CoreGraphics Y-axis is flipped vs AppKit)
let contentRect = CGRect(x: padding, y: padding,
                         width: size - padding * 2, height: size - padding * 2)
ctx.draw(cgSrc, in: contentRect)

// Export PNG
guard let result = ctx.makeImage() else { print("Render failed"); exit(1) }
let rep = NSBitmapImageRep(cgImage: result)
guard let png = rep.representation(using: .png, properties: [:]) else { print("PNG encode failed"); exit(1) }
try! png.write(to: URL(fileURLWithPath: args[2]))
print("Saved \(args[2]) (\(px)×\(px), padding=\(Int(paddingFraction*100))%, radius=\(Int(radius))px)")
