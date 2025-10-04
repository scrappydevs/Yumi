//
//  CustomCameraView.swift
//  aegis
//
//  OpenAI-inspired camera with Apple minimalism
//

import SwiftUI
import AVFoundation

struct CustomCameraView: View {
    @Environment(\.dismiss) var dismiss
    @StateObject private var camera = CameraModel()
    var onImageCaptured: (UIImage) -> Void
    
    var body: some View {
        ZStack {
            // Camera Preview (Full Screen)
            CameraPreview(camera: camera)
                .ignoresSafeArea()
            
            // Top Bar - Minimal controls
            VStack {
                HStack {
                    // Close Button
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 20, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(width: 44, height: 44)
                            .background(
                                Circle()
                                    .fill(.ultraThinMaterial)
                            )
                    }
                    
                    Spacer()
                    
                    // Flash Toggle
                    Button {
                        camera.toggleFlash()
                    } label: {
                        Image(systemName: camera.flashMode == .on ? "bolt.fill" : "bolt.slash.fill")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(camera.flashMode == .on ? .yellow : .white)
                            .frame(width: 44, height: 44)
                            .background(
                                Circle()
                                    .fill(.ultraThinMaterial)
                            )
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 20)
                
                Spacer()
            }
            
            // Bottom Bar - Glassmorphic with capture button
            VStack {
                Spacer()
                
                // Capture Button (OpenAI style)
                Button {
                    camera.capturePhoto()
                } label: {
                    ZStack {
                        // Outer ring
                        Circle()
                            .strokeBorder(.white, lineWidth: 4)
                            .frame(width: 80, height: 80)
                        
                        // Inner button
                        Circle()
                            .fill(.white)
                            .frame(width: 68, height: 68)
                    }
                }
                .scaleEffect(camera.isCapturing ? 0.9 : 1.0)
                .animation(.spring(response: 0.3, dampingFraction: 0.6), value: camera.isCapturing)
                .padding(.bottom, 40)
            }
            
            // Captured Photo Preview
            if let capturedImage = camera.capturedImage {
                Color.black
                    .ignoresSafeArea()
                
                VStack {
                    // Preview Controls
                    HStack {
                        Button {
                            camera.retake()
                        } label: {
                            Image(systemName: "arrow.counterclockwise")
                                .font(.system(size: 20, weight: .semibold))
                                .foregroundColor(.white)
                                .frame(width: 44, height: 44)
                                .background(
                                    Circle()
                                        .fill(.ultraThinMaterial)
                                )
                        }
                        
                        Spacer()
                        
                        Button {
                            // Call the callback BEFORE dismissing to ensure state is set
                            print("✅ [CAMERA] Use Photo tapped, calling callback with image")
                            onImageCaptured(capturedImage)
                            // Give a tiny moment for the callback to complete
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                                print("✅ [CAMERA] Dismissing camera")
                                dismiss()
                            }
                        } label: {
                            Image(systemName: "checkmark")
                                .font(.system(size: 20, weight: .bold))
                                .foregroundColor(.white)
                                .frame(width: 44, height: 44)
                                .background(
                                    Circle()
                                        .fill(Color.green)
                                )
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 20)
                    
                    Spacer()
                    
                    // Captured Image
                    Image(uiImage: capturedImage)
                        .resizable()
                        .scaledToFit()
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                        .padding(.horizontal, 20)
                    
                    Spacer()
                    
                    // Use Photo Button (Primary CTA)
                    Button {
                        // Call the callback BEFORE dismissing to ensure state is set
                        print("✅ [CAMERA] Use Photo button tapped, calling callback with image")
                        onImageCaptured(capturedImage)
                        // Give a tiny moment for the callback to complete
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                            print("✅ [CAMERA] Dismissing camera")
                            dismiss()
                        }
                    } label: {
                        Text("Use Photo")
                            .font(.system(.headline, design: .rounded))
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 56)
                            .background(
                                RoundedRectangle(cornerRadius: 16)
                                    .fill(Color.green)
                            )
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 40)
                }
                .transition(.opacity)
            }
            
            // Flash Effect
            if camera.showFlash {
                Color.white
                    .ignoresSafeArea()
                    .opacity(camera.flashOpacity)
                    .animation(.easeOut(duration: 0.2), value: camera.flashOpacity)
            }
        }
        .statusBar(hidden: true)
        .onAppear {
            camera.checkPermissions()
        }
        .onDisappear {
            camera.stopCamera()
        }
    }
}

// MARK: - Camera Model
@MainActor
class CameraModel: NSObject, ObservableObject {
    @Published var capturedImage: UIImage?
    @Published var isCapturing = false
    @Published var showFlash = false
    @Published var flashOpacity: Double = 0
    @Published var flashMode: AVCaptureDevice.FlashMode = .off
    @Published var isCameraReady = false  // Triggers UI update when session is ready

    var captureSession: AVCaptureSession?
    private var photoOutput: AVCapturePhotoOutput?
    private var previewLayer: AVCaptureVideoPreviewLayer?
    
    func checkPermissions() {
        // Only setup once
        guard captureSession == nil else {
            print("🎥 [CAMERA] Session already exists, skipping setup")
            return
        }
        
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            Task {
                await setupCamera()
            }
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
                if granted {
                    Task { @MainActor in
                        await self?.setupCamera()
                    }
                }
            }
        default:
            break
        }
    }
    
    func setupCamera() async {
        print("🎥 [CAMERA] Setting up camera...")
        let session = AVCaptureSession()
        session.beginConfiguration()
        session.sessionPreset = .photo

        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
              let input = try? AVCaptureDeviceInput(device: device) else {
            print("❌ [CAMERA] Failed to get camera device or input")
            return
        }

        print("✅ [CAMERA] Got camera device")

        if session.canAddInput(input) {
            session.addInput(input)
        }

        let output = AVCapturePhotoOutput()
        if session.canAddOutput(output) {
            session.addOutput(output)
            photoOutput = output
        }

        session.commitConfiguration()

        // Start session on background thread BEFORE setting it
        // This ensures the session is running when the preview layer gets it
        await Task.detached {
            session.startRunning()
        }.value

        print("✅ [CAMERA] Session started. Running: \(session.isRunning)")

        // Set session on main thread AFTER it's running
        await MainActor.run {
            self.captureSession = session
            self.isCameraReady = true  // Trigger UI update
        }

        print("✅ [CAMERA] Session assigned to model")
    }
    
    func capturePhoto() {
        guard let photoOutput = photoOutput else { return }
        
        let settings = AVCapturePhotoSettings()
        settings.flashMode = flashMode
        
        isCapturing = true
        
        // Flash animation
        showFlash = true
        flashOpacity = 1.0
        Task {
            try? await Task.sleep(nanoseconds: 100_000_000) // 0.1s
            flashOpacity = 0
            try? await Task.sleep(nanoseconds: 100_000_000)
            showFlash = false
        }
        
        photoOutput.capturePhoto(with: settings, delegate: self)
        
        // Haptic feedback
        let impact = UIImpactFeedbackGenerator(style: .medium)
        impact.impactOccurred()
    }
    
    func retake() {
        capturedImage = nil
        isCapturing = false
        
        // Restart camera if needed
        if captureSession?.isRunning == false {
            DispatchQueue.global(qos: .userInitiated).async { [weak self] in
                self?.captureSession?.startRunning()
            }
        }
    }
    
    func toggleFlash() {
        flashMode = flashMode == .off ? .on : .off
    }
    
    func stopCamera() {
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            self?.captureSession?.stopRunning()
        }
    }
    
    func getPreviewLayer() -> AVCaptureVideoPreviewLayer? {
        guard let session = captureSession else { return nil }
        
        if previewLayer == nil {
            let layer = AVCaptureVideoPreviewLayer(session: session)
            layer.videoGravity = .resizeAspectFill
            layer.connection?.videoOrientation = .portrait
            previewLayer = layer
        }
        
        return previewLayer
    }
}

// MARK: - Photo Capture Delegate
extension CameraModel: AVCapturePhotoCaptureDelegate {
    nonisolated func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
        guard let imageData = photo.fileDataRepresentation(),
              let image = UIImage(data: imageData) else {
            return
        }
        
        Task { @MainActor in
            self.capturedImage = image
            self.isCapturing = false
        }
    }
}

// MARK: - Camera Preview
struct CameraPreview: UIViewRepresentable {
    @ObservedObject var camera: CameraModel
    
    func makeUIView(context: Context) -> CameraPreviewView {
        let view = CameraPreviewView()
        return view
    }
    
    func updateUIView(_ uiView: CameraPreviewView, context: Context) {
        // Update session on the preview layer when camera is ready
        if camera.isCameraReady, let session = camera.captureSession {
            if uiView.videoPreviewLayer.session !== session {
                print("🎥 [CAMERA] Setting session to preview layer. Session running: \(session.isRunning)")
                uiView.videoPreviewLayer.session = session

                // Ensure video orientation is set after session assignment
                if let connection = uiView.videoPreviewLayer.connection, connection.isVideoOrientationSupported {
                    connection.videoOrientation = .portrait
                    print("🎥 [CAMERA] Video orientation set to portrait")
                }
            }
        }
    }
}

class CameraPreviewView: UIView {
    override class var layerClass: AnyClass {
        AVCaptureVideoPreviewLayer.self
    }
    
    var videoPreviewLayer: AVCaptureVideoPreviewLayer {
        return layer as! AVCaptureVideoPreviewLayer
    }
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = .black
        print("🎥 [CAMERA] Preview view initialized")
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        // Ensure preview layer fills the view
        videoPreviewLayer.frame = bounds
        videoPreviewLayer.videoGravity = .resizeAspectFill
        if let connection = videoPreviewLayer.connection, connection.isVideoOrientationSupported {
            connection.videoOrientation = .portrait
        }
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}

#Preview {
    CustomCameraView { image in
        print("Captured image: \(image)")
    }
}

