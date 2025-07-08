import { Button } from '../ui/button';
import { useState, useEffect, useRef } from 'react';
import { useDaily, useLocalSessionId } from '@daily-co/daily-react';
import { Video } from '../Video';
import { CameraSettings } from '../CameraSettings';
import { Call } from '../Call';
import { IConversation } from '@/types';


export const WelcomeScreen = ({
  onStart,
  loading,
  screen,
  conversation,
  handleEnd,
  handleJoin
}: {
  onStart: () => void,
  loading: boolean,
  screen: 'welcome' | 'hairCheck' | 'call',
  conversation: IConversation | null,
  handleEnd: () => void,
  handleJoin: () => void
}) => {
  const [activeSection, setActiveSection] = useState('home');
  const [isVideoMaximized, setIsVideoMaximized] = useState(false); // Default to minimize mode

  // Reset to minimize mode when starting a new call
  useEffect(() => {
    if (screen === 'call') {
      console.log('🔄 Resetting to minimize mode for new call');
      setIsVideoMaximized(false);
    }
  }, [screen]);

  const [videoPlaying, setVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const localSessionId = useLocalSessionId();
  const daily = useDaily();
  const videoRef = useRef<HTMLVideoElement>(null);
  const homeRef = useRef(null);
  const servicesRef = useRef(null);
  const aboutRef = useRef(null);
  const contactRef = useRef(null);


  useEffect(() => {
    if (screen === 'hairCheck' && daily) {
      daily?.startCamera({ startVideoOff: false, startAudioOff: false });
    }
  }, [daily, localSessionId, screen]);

  // Force video to play when component mounts
  useEffect(() => {
    if (screen === 'welcome' && videoRef.current) {
      const video = videoRef.current;
      const playVideo = async () => {
        try {
          await video.play();
          console.log('🎬 Video force play successful');
        } catch (error) {
          console.log('⚠️ Video force play failed:', error);
        }
      };

      // Small delay to ensure video is loaded
      const timer = setTimeout(playVideo, 100);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  useEffect(() => {
    if (screen === 'call' && conversation && daily) {
      const { conversation_url } = conversation;
      daily.join({
        url: conversation_url,
      });
    }
  }, [daily, conversation, screen]);

  const handleLeave = async () => {
    await daily?.leave();
    handleEnd();
  };

  const startVideoPlayback = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.play();
        setVideoPlaying(true);
        console.log('✅ Video playback started');
      } catch (error) {
        console.log('⚠️ Video playback failed:', error);
      }
    }
  };

  const handleVideoContainerClick = () => {
    if (!videoPlaying) {
      startVideoPlayback();
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !isMuted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);

      // Update audio state based on mute state
      // Note: audioTracks is not available on HTMLVideoElement in TypeScript

      console.log(newMutedState ? '🔇 Audio muted' : '🔊 Audio unmuted');
    }
  };

  const handleStart = () => {
    // Start video if not already playing
    if (!videoPlaying) {
      startVideoPlayback();
    }
    // Skip hairCheck screen and go directly to call
    onStart();
  };



  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
  const sections = [
    { id: 'home', ref: homeRef },
    { id: 'services', ref: servicesRef },
    { id: 'about', ref: aboutRef },
    { id: 'contact', ref: contactRef },
  ];

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.5, // 50% of the section should be visible
  };

  const observerCallback = (entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const matchedSection = sections.find(s => s.ref.current === entry.target);
        if (matchedSection) {
          setActiveSection(matchedSection.id);
        }
      }
    });
  };

  const observer = new IntersectionObserver(observerCallback, observerOptions);

  sections.forEach(section => {
    if (section.ref.current) {
      observer.observe(section.ref.current);
    }
  });

  return () => observer.disconnect();
}, []);


  const sectionStyle = "py-16 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto";

  return (
    <div className={`min-h-screen font-sans text-gray-800 flex flex-col ${isVideoMaximized && screen === 'call' ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Header - Hide in full screen mode */}
      {!(isVideoMaximized && screen === 'call') && (
        <header className="bg-white shadow-md py-4 px-4 md:px-8 lg:px-16 sticky top-0 z-50">
        <nav className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center mb-4 md:mb-0">
           <img
              src="https://placehold.co/40x40/000000/FFFFFF?text=M"
              alt="Metcalf.ai Logo"
              className="rounded-full mr-3"
            />
            <a href="#" onClick={() => setActiveSection('home')} className="text-2xl font-bold text-gray-900">
              Metcalf.ai
            </a>
          </div>
          <ul className="flex flex-wrap justify-center md:justify-end space-x-4 md:space-x-8 text-lg font-medium">
            <li>
              <a
                href="#home"
                onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}
                className={`hover:text-blue-600 transition-colors duration-200 ${activeSection === 'home' ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}
              >
                Home
              </a>
            </li>
            <li>
              <a
                href="#services"
                onClick={(e) => { e.preventDefault(); scrollToSection('services'); }}
                className={`hover:text-blue-600 transition-colors duration-200 ${activeSection === 'services' ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}
              >
                Services
              </a>
            </li>
            <li>
              <a
                href="#about"
                onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}
                className={`hover:text-blue-600 transition-colors duration-200 ${activeSection === 'about' ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}
              >
                About Michael
              </a>
            </li>
            <li>
              <a
                href="#contact"
                onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}
                className={`hover:text-blue-600 transition-colors duration-200 ${activeSection === 'contact' ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}
              >
                Contact
              </a>
            </li>
          </ul>
        </nav>
        </header>
      )}

      {/* Main Content - Hide in full screen mode */}
      {!(isVideoMaximized && screen === 'call') && (
      <main className="flex-grow">
        {/* Hero Section */}
        <section id="home" ref={homeRef} className="py-16 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto bg-gradient-to-br from-blue-50 to-indigo-100 rounded-b-xl shadow-inner">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-4">
              Unlock Your Business Potential with AI-Powered Software
            </h1>
            <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto">
              Metcalf.ai designs, builds, and deploys custom software to automate your business, increase sales, and achieve 5X productivity.
            </p>


          </div>

          <div className="flex flex-col lg:flex-row items-center lg:items-start lg:space-x-12">
            {/* AI Assistant Interface Container */}
            <div className="w-full lg:w-2/3 flex flex-col">
              {/* Main Card */}
              <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-200 flex flex-col relative h-[500px]">
              {screen === 'welcome' && (
                <>
                  {/* Video Interface Container */}
                  <div
                    className="flex-grow flex flex-col items-center justify-end rounded-lg relative min-h-[400px] bg-black cursor-pointer"
                    onClick={handleVideoContainerClick}
                  >
                    {/* Background Video */}
                    <video
                      ref={videoRef}
                      autoPlay
                      loop
                      muted={isMuted}
                      playsInline
                      preload="auto"
                      className="absolute top-0 left-0 w-full h-full object-cover rounded-lg"
                      onLoadedMetadata={() => {
                        if (videoRef.current) {
                          console.log('📹 Video loaded');
                          console.log('📹 Video duration:', videoRef.current.duration);
                          console.log('📹 Video readyState:', videoRef.current.readyState);
                          console.log('📹 Video paused:', videoRef.current.paused);
                        }
                      }}
                      onCanPlay={() => {
                        console.log('📹 Video can play');
                        // Try to start video playback when ready
                        if (!videoPlaying) {
                          startVideoPlayback();
                        }
                      }}
                      onPlay={() => {
                        console.log('▶️ Video started playing');
                        setVideoPlaying(true);
                      }}
                      onPause={() => {
                        console.log('⏸️ Video paused');
                      }}
                      onError={(e) => {
                        console.error('❌ Video error:', e);
                      }}
                      onLoadStart={() => {
                        console.log('📹 Video load started');
                      }}
                    >
                      <source src="https://myhealthrtm.s3.us-west-1.amazonaws.com/icons/4a8d56aba0.mp4" type="video/mp4" />
                    </video>

                    {/* Play Button Overlay - Show when video is not playing */}
                    {!videoPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 bg-black bg-opacity-30 rounded-lg">
                        <div className="bg-white bg-opacity-90 rounded-full p-4 shadow-lg hover:bg-opacity-100 transition-all">
                          <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Mute/Unmute Toggle Button */}
                    <button
                      onClick={toggleMute}
                      className="absolute top-4 right-4 z-20 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all shadow-lg"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.828 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.828l3.555-3.793A1 1 0 019.383 3.076zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.828 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.828l3.555-3.793A1 1 0 019.383 3.076zM7 7a1 1 0 012 0v6a1 1 0 11-2 0V7zM15.383 6.076A1 1 0 0116 7v6a1 1 0 01-1.617.793L12.828 12H11a1 1 0 01-1-1V9a1 1 0 011-1h1.828l1.555-1.207A1 1 0 0115.383 6.076z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>

                    {/* Overlay for button */}
                    <div className="relative z-20 p-8">
                      <Button
                        onClick={handleStart}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-base font-medium rounded-md shadow-lg"
                        disabled={loading}
                      >
                        {loading ? 'Loading...' : 'Start Conversation'}
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {screen === 'hairCheck' && (
                <>
                  {/* Video Container - Full Screen */}
                  <div className="flex-grow flex justify-center items-center mb-3 relative">
                    {/* Background Video */}
                    <video
                      autoPlay
                      loop
                      muted={false}
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover rounded-lg"
                    >
                      <source src="https://myhealthrtm.s3.us-west-1.amazonaws.com/icons/4a8d56aba0.mp4" type="video/mp4" />
                    </video>

                    <div className="relative w-full h-full z-10">
                      <Video
                        id={localSessionId}
                        className="w-full h-full rounded-lg shadow-md object-cover opacity-80"
                      />

                      {/* Camera/Mic Controls - Left Side */}
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-2">
                        <CameraSettings showOnlyToggles={true} />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons Inside Card */}
                  <div className="flex justify-between mt-4 px-4">
                    <Button
                      onClick={handleEnd}
                      variant="outline"
                      className="px-6 py-2"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleJoin}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                    >
                      Join Call
                    </Button>
                  </div>
                </>
              )}

              {screen === 'call' && !isVideoMaximized && (
                <>
                  {/* Call Interface - Regular Mode */}
                  <div className="flex-grow flex justify-center items-center mb-3 relative">
                    <div className="w-full h-full relative">
                      <Call />

                      {/* Maximize Button - Inside Video Top Right */}
                      <div className="absolute top-4 right-4 z-20">
                        <button
                          className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors flex items-center justify-center"
                          title="Maximize"
                          onClick={() => {
                            console.log('🔍 Maximize button clicked');
                            setIsVideoMaximized(true);
                          }}
                        >
                          <i className="fa fa-expand" aria-hidden="true"></i>
                        </button>
                      </div>

                      {/* Camera/Mic Controls - Left Side */}
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-2">
                        <CameraSettings showOnlyToggles={true} />
                      </div>
                    </div>
                  </div>

                  {/* Action Button Inside Card */}
                  <div className="flex justify-center mt-4 px-4">
                    <Button
                      onClick={handleLeave}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
                    >
                      Leave Call
                    </Button>
                  </div>
                </>
              )}
              </div>
            </div>

            {/* Service Cards Sidebar */}
             <div className="w-full lg:w-1/3 mt-12 lg:mt-0 space-y-8 animate-fade-in-right">
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-300">
                <h3 className="text-2xl font-semibold text-gray-800 mb-3">For Existing Businesses</h3>
                <p className="text-gray-700">
                  Automate processes, boost sales, and achieve up to <span className="font-bold text-blue-600">5X productivity</span> increases.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-300">
                <h3 className="text-2xl font-semibold text-gray-800 mb-3">For Startups & Entrepreneurs</h3>
                {/* Fixed: Removed duplicate 'className' attribute */}
                <p className="text-gray-700">
                  Build <span className="font-bold text-blue-600">net new technology</span> from concept to deployment, turning your vision into reality.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-300">
                <h3 className="text-2xl font-semibold text-gray-800 mb-3">Consulting & Co-Investment</h3>
                <p className="text-gray-700">
                  Benefit from expert consulting or explore <span className="font-bold text-blue-600">co-investment options</span> for novel tech ideas.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" ref={servicesRef}  className={`${sectionStyle} bg-white rounded-xl shadow-lg mt-8`}>
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Service Card 1 */}
            <div className="bg-blue-50 p-6 rounded-xl shadow-md border border-blue-100 hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
              <div className="text-5xl text-blue-600 mb-4 text-center">
                <i className="fas fa-robot"></i> {/* Placeholder for icon */}
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-3 text-center">Business Automation</h3>
              <p className="text-gray-700 text-center">
                Streamline operations, reduce manual effort, and significantly boost efficiency across your business processes.
              </p>
            </div>
            {/* Service Card 2 */}
            <div className="bg-green-50 p-6 rounded-xl shadow-md border border-green-100 hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
              <div className="text-5xl text-green-600 mb-4 text-center">
                <i className="fas fa-lightbulb"></i> {/* Placeholder for icon */}
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-3 text-center">New Technology Development</h3>
              <p className="text-gray-700 text-center">
                From concept to launch, we build innovative software solutions for startups and entrepreneurs.
              </p>
            </div>
            {/* Service Card 3 */}
            <div className="bg-purple-50 p-6 rounded-xl shadow-md border border-purple-100 hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
              <div className="text-5xl text-purple-600 mb-4 text-center">
                <i className="fas fa-handshake"></i> {/* Placeholder for icon */}
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-3 text-center">Expert Consulting</h3>
              <p className="text-gray-700 text-center">
                Leverage our deep expertise to strategize, plan, and execute your most ambitious tech projects.
              </p>
            </div>
            {/* Service Card 4 */}
            <div className="bg-yellow-50 p-6 rounded-xl shadow-md border border-yellow-100 hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
              <div className="text-5xl text-yellow-600 mb-4 text-center">
                <i className="fas fa-dollar-sign"></i> {/* Placeholder for icon */}
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-3 text-center">Co-Investment Opportunities</h3>
              <p className="text-gray-700 text-center">
                We partner with founders, offering co-investment and strategic support for novel ideas.
              </p>
            </div>
          </div>
        </section>

        {/* About Michael Section */}
        <section id="about" ref={aboutRef} className={`${sectionStyle} bg-gray-100 rounded-xl shadow-lg mt-8`}>
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">About Michael Metcalf</h2>
          <div className="flex flex-col md:flex-row items-center md:space-x-12">
            <div className="md:w-1/3 mb-8 md:mb-0">
              <img
                src="https://myhealthrtm.s3.us-west-1.amazonaws.com/icons/074-8-igI3sNdpo.jpeg"
                alt="Michael Metcalf"
                className="rounded-full shadow-lg mx-auto w-48 h-48 md:w-full md:h-auto object-cover border-4 border-blue-200"
              />
            </div>
            <div className="md:w-2/3 text-lg text-gray-700 leading-relaxed">
              <p className="mb-4">
                Michael Metcalf is a visionary leader in software design and technology deployment, with a passion for transforming businesses through automation and innovation. With years of experience, Michael has a proven track record of helping existing business owners achieve significant operational efficiencies and sales growth, often leading to a remarkable <span className="font-bold text-blue-600">5X increase in productivity</span>.
              </p>
              <p className="mb-4">
                Beyond optimizing established enterprises, Michael and his team are dedicated to fostering the next generation of technology. They specialize in building net new, cutting-edge solutions for technology startups and ambitious entrepreneurs, guiding them from initial concept through to successful market deployment.
              </p>
              <p>
                Michael also actively engages in consulting services and explores co-investment opportunities, partnering with founders who possess novel technology ideas or robust business plans. His unique blend of technical acumen, business insight, and investment readiness makes Metcalf.ai a powerful ally for any venture seeking to leverage technology for competitive advantage.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" ref={contactRef} className={`${sectionStyle} bg-blue-600 text-white rounded-xl shadow-lg mt-8`}>
          <h2 className="text-4xl font-bold text-center mb-12">Ready to Transform Your Business?</h2>
          <p className="text-xl text-center mb-10 max-w-2xl mx-auto">
            Engage Michael Metcalf and his team to design, build, and deploy custom software that drives sales, optimizes performance, and achieves unparalleled productivity.
          </p>
          <div className="flex flex-col md:flex-row justify-center items-center md:space-x-8 space-y-6 md:space-y-0">
            <a
              href="mailto:info@metcalf.ai"
              className="bg-white text-blue-600 px-8 py-4 rounded-full text-xl font-semibold shadow-lg hover:bg-blue-100 hover:scale-105 transition-all duration-300 flex items-center"
            >
              <i className="fas fa-envelope mr-3"></i> Email Us
            </a>
            <a
              href="#"
              onClick={(e) => {
          e.preventDefault();
        setActiveSection('home');
        setTimeout(() => {
          videoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100); // Small delay to ensure `setActiveSection` triggers first
       }}// Direct to AI agent
              className="bg-blue-800 text-white px-8 py-4 rounded-full text-xl font-semibold shadow-lg hover:bg-blue-900 hover:scale-105 transition-all duration-300 flex items-center"
            >
              <i className="fas fa-comments mr-3"></i> Talk to Our AI
            </a>
          </div>
        </section>
      </main>
      )}

      {/* Full Screen Call Interface */}
      {isVideoMaximized && screen === 'call' && (
        <div className="fixed inset-0 bg-black z-50">
          <div className="relative w-full h-full">
            <Call />

            {/* Minimize Button - Inside Video Top Right */}
            <div className="absolute top-4 right-4 z-20">
              <button
                className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors flex items-center justify-center"
                title="Exit Full Screen"
                onClick={() => {
                  console.log('🔽 Minimize button clicked');
                  setIsVideoMaximized(false);
                }}
              >
                <i className="fa fa-compress" aria-hidden="true"></i>
              </button>
            </div>

            {/* Camera/Mic Controls - Left Side */}
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-2 z-20">
              <CameraSettings showOnlyToggles={true} />
            </div>

            {/* Leave Call Button - Bottom Center */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
              <Button
                onClick={handleLeave}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
              >
                Leave Call
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer - Hide in full screen mode */}
      {!(isVideoMaximized && screen === 'call') && (
        <footer className="bg-gray-900 text-gray-300 py-8 px-4 md:px-8 lg:px-16 mt-8">
        <div className="max-w-7xl mx-auto text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Metcalf.ai. All rights reserved.</p>
          <p className="mt-2">
            <a href="#" className="hover:text-white transition-colors duration-200 mr-4">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors duration-200">Terms of Service</a>
          </p>
         <p className="mt-4">
            Follow us on:
            <a href="#" className="ml-4 hover:text-white transition-colors duration-200"><i className="fab fa-linkedin text-xl"></i></a>
            <a href="#" className="ml-4 hover:text-white transition-colors duration-200"><i className="fab fa-twitter text-xl"></i></a>
          </p>
        </div>
        </footer>
      )}

         {/* Font Awesome for Icons */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" crossOrigin="anonymous" referrerPolicy="no-referrer" />
      {/* Inter Font */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

    </div>
  );
};
