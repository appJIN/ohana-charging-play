import SwiftUI
import Combine
import AudioToolbox

// MARK: - Battery Manager
class BatteryManager: ObservableObject {
    @Published var batteryLevel: Int = 0
    @Published var isCharging: Bool = false
    @Published var isFull: Bool = false
    
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        UIDevice.current.isBatteryMonitoringEnabled = true
        updateBatteryStatus()
        
        // Listen for battery level and state changes
        NotificationCenter.default.publisher(for: UIDevice.batteryLevelDidChangeNotification)
            .sink { [weak self] _ in self?.updateBatteryStatus() }
            .store(in: &cancellables)
            
        NotificationCenter.default.publisher(for: UIDevice.batteryStateDidChangeNotification)
            .sink { [weak self] _ in self?.updateBatteryStatus() }
            .store(in: &cancellables)
    }
    
    func updateBatteryStatus() {
        let level = UIDevice.current.batteryLevel
        if level < 0 {
            self.batteryLevel = 100 // Simulator fallback
        } else {
            self.batteryLevel = Int(round(level * 100))
        }
        
        let state = UIDevice.current.batteryState
        self.isCharging = (state == .charging || state == .full)
        self.isFull = (self.batteryLevel >= 100)
        
        if self.isFull {
            // Alert user when 100% full
            AudioServicesPlaySystemSound(1005) // SMS alert tone
        }
    }
}

// MARK: - Theme Color Palettes
enum OCPTheme: String, CaseIterable, Identifiable {
    case neonGreen = "Neon Emerald"
    case cyberCyan = "Cyber Cyan"
    case electricPurple = "Electric Violet"
    case solarGold = "Solar Gold"
    
    var id: String { rawValue }
    
    var primary: Color {
        switch self {
        case .neonGreen: return Color(red: 0.1, green: 1.0, blue: 0.45)
        case .cyberCyan: return Color(red: 0.0, green: 0.88, blue: 1.0)
        case .electricPurple: return Color(red: 0.78, green: 0.2, blue: 1.0)
        case .solarGold: return Color(red: 1.0, green: 0.8, blue: 0.0)
        }
    }
    
    var secondary: Color {
        switch self {
        case .neonGreen: return Color(red: 0.0, green: 0.5, blue: 0.2)
        case .cyberCyan: return Color(red: 0.0, green: 0.35, blue: 0.6)
        case .electricPurple: return Color(red: 0.4, green: 0.05, blue: 0.6)
        case .solarGold: return Color(red: 0.6, green: 0.35, blue: 0.0)
        }
    }
}

// MARK: - Main Content View
struct ContentView: View {
    @StateObject private var batteryManager = BatteryManager()
    @State private var selectedTheme: OCPTheme = .neonGreen
    @State private var rotationAngle: Double = 0
    @State private var pulseScale: CGFloat = 1.0
    @State private var particleOffset: CGFloat = 0
    @State private var currentTime = Date()
    
    let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()
    
    var body: some View {
        ZStack {
            // Pure OLED pitch black background for iPhone XS display
            Color.black
                .ignoresSafeArea()
            
            // Ambient Glow
            RadialGradient(
                gradient: Gradient(colors: [
                    selectedTheme.primary.opacity(0.18),
                    Color.black
                ]),
                center: .center,
                startRadius: 50,
                endRadius: 360
            )
            .ignoresSafeArea()
            
            VStack(spacing: 24) {
                // Top Branding: Ohana Charging Play (OCP)
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("OHANA CHARGING PLAY")
                            .font(.system(size: 14, weight: .black, design: .rounded))
                            .tracking(2.5)
                            .foregroundColor(selectedTheme.primary)
                        
                        Text("OCP SYSTEM ACTIVE • DISPLAY ON")
                            .font(.system(size: 10, weight: .semibold, design: .monospaced))
                            .foregroundColor(.gray)
                    }
                    
                    Spacer()
                    
                    // Theme Switcher Button
                    Menu {
                        ForEach(OCPTheme.allCases) { theme in
                            Button(action: { selectedTheme = theme }) {
                                Text(theme.rawValue)
                            }
                        }
                    } label: {
                        Image(systemName: "paintpalette.fill")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(selectedTheme.primary)
                            .padding(8)
                            .background(Circle().fill(Color.white.opacity(0.08)))
                    }
                }
                .padding(.horizontal, 28)
                .padding(.top, 16)
                
                Spacer()
                
                // Central High-Visibility Charging Animation
                ZStack {
                    // Outer Pulsing Ring
                    Circle()
                        .stroke(
                            selectedTheme.primary.opacity(0.2),
                            lineWidth: 3
                        )
                        .scaleEffect(pulseScale)
                        .frame(width: 280, height: 280)
                        .animation(
                            Animation.easeInOut(duration: 2.0).repeatForever(autoreverses: true),
                            value: pulseScale
                        )
                    
                    // Rotating Segmented Energy Ring
                    Circle()
                        .trim(from: 0.0, to: 0.8)
                        .stroke(
                            AngularGradient(
                                gradient: Gradient(colors: [
                                    selectedTheme.primary,
                                    selectedTheme.secondary,
                                    .clear
                                ]),
                                center: .center
                            ),
                            style: StrokeStyle(lineWidth: 10, lineCap: .round, dash: [14, 8])
                        )
                        .frame(width: 250, height: 250)
                        .rotationEffect(.degrees(rotationAngle))
                    
                    // Inner Circular Progress Glow
                    Circle()
                        .trim(from: 0, to: CGFloat(batteryManager.batteryLevel) / 100.0)
                        .stroke(
                            selectedTheme.primary,
                            style: StrokeStyle(lineWidth: 8, lineCap: .round)
                        )
                        .frame(width: 220, height: 220)
                        .rotationEffect(.degrees(-90))
                        .shadow(color: selectedTheme.primary.opacity(0.9), radius: 15)
                    
                    // High-Contrast Core Display (Super Visible for Low Vision)
                    VStack(spacing: 4) {
                        // Lightning Bolt Icon
                        Image(systemName: batteryManager.isCharging ? "bolt.fill" : "bolt.slash.fill")
                            .font(.system(size: 34, weight: .heavy))
                            .foregroundColor(selectedTheme.primary)
                            .shadow(color: selectedTheme.primary, radius: 10)
                            .scaleEffect(batteryManager.isCharging ? 1.15 : 1.0)
                            .animation(Animation.easeInOut(duration: 0.8).repeatForever(autoreverses: true), value: batteryManager.isCharging)
                        
                        // JUMBO BATTERY PERCENTAGE
                        HStack(alignment: .firstTextBaseline, spacing: 2) {
                            Text("\(batteryManager.batteryLevel)")
                                .font(.system(size: 78, weight: .black, design: .rounded))
                                .foregroundColor(.white)
                                .shadow(color: selectedTheme.primary.opacity(0.8), radius: 12)
                            
                            Text("%")
                                .font(.system(size: 32, weight: .bold, design: .rounded))
                                .foregroundColor(selectedTheme.primary)
                        }
                        
                        // Clear Status Text
                        Text(batteryManager.isFull ? "FULLY CHARGED" : (batteryManager.isCharging ? "FAST CHARGING" : "NOT CHARGING"))
                            .font(.system(size: 13, weight: .black, design: .monospaced))
                            .tracking(2.0)
                            .foregroundColor(batteryManager.isFull ? .yellow : selectedTheme.primary)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 4)
                            .background(
                                Capsule()
                                    .fill(selectedTheme.primary.opacity(0.15))
                            )
                    }
                }
                
                Spacer()
                
                // Bottom Section: Big Clock & Always-On Notice
                VStack(spacing: 12) {
                    // Big Readable Clock
                    Text(currentTime, style: .time)
                        .font(.system(size: 30, weight: .semibold, design: .monospaced))
                        .foregroundColor(.white.opacity(0.85))
                    
                    // Status Badge
                    HStack(spacing: 8) {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 8, height: 8)
                            .scaleEffect(pulseScale)
                        
                        Text("SCREEN SLEEP DISABLED • ALWAYS ON")
                            .font(.system(size: 11, weight: .bold, design: .rounded))
                            .foregroundColor(.gray)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(
                        RoundedRectangle(cornerRadius: 14)
                            .fill(Color.white.opacity(0.05))
                    )
                }
                .padding(.bottom, 24)
            }
        }
        .onAppear {
            // CRITICAL: Prevent iPhone XS from going to sleep / turning screen off!
            UIApplication.shared.isIdleTimerDisabled = true
            
            // Start rotation & pulse animations
            withAnimation(Animation.linear(duration: 6.0).repeatForever(autoreverses: false)) {
                rotationAngle = 360
            }
            pulseScale = 1.08
        }
        .onDisappear {
            // Restore normal sleep behavior when app is closed
            UIApplication.shared.isIdleTimerDisabled = false
        }
        .onReceive(timer) { input in
            currentTime = input
        }
    }
}

// MARK: - App Entry Point
@main
struct OhanaChargingPlayApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
