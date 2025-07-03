import './App.css';
import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';


const App = () => {
  
  const [activeSection, setActiveSection] = useState('home');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [db, setDb] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting', 'connected', 'disconnected', 'error'
  const chatMessagesEndRef = useRef(null);

  // Scroll to the latest message in the chat
  const scrollToBottom = () => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        console.log('🔥 Initializing Firebase...');
        setConnectionStatus('connecting');

        // Firebase configuration from environment variables
        const firebaseConfig = {
          apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
          authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
          storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.REACT_APP_FIREBASE_APP_ID,
          measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
        };

        // Validate configuration
        if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
          throw new Error('Firebase configuration is incomplete. Please check your environment variables.');
        }

        // Initialize Firebase app (only once)
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        console.log('✅ Firebase app initialized');

        // Initialize Firestore with specific database
        const firestoreDb = getFirestore(app, 'metcalfai');
        setDb(firestoreDb);
        console.log('✅ Firestore initialized with database: metcalfai');

        // Initialize Firebase Auth
        const firebaseAuth = getAuth(app);
        console.log('✅ Firebase Auth initialized');

        // Set up auth state listener
        onAuthStateChanged(firebaseAuth, async (user) => {
          if (user) {
            setUserId(user.uid);
            setIsAuthReady(true);
            setConnectionStatus('connected');
            console.log('✅ User authenticated:', user.uid);
          } else {
            try {
              console.log('🔐 Signing in anonymously...');
              await signInAnonymously(firebaseAuth);
            } catch (error) {
              console.error('❌ Anonymous sign-in failed:', error);
              setConnectionStatus('error');
              setChatHistory([{
                role: 'ai',
                text: 'Unable to connect to the service. Please refresh the page and try again.'
              }]);
            }
          }
        });

      } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        setConnectionStatus('error');
        setChatHistory([{
          role: 'ai',
          text: 'Unable to initialize the service. Please check your internet connection and refresh the page.'
        }]);
      }
    };

    initializeFirebase();
  }, []);

  // useEffect(() => {
  //   // Listen for chat history changes from Firestore
  //   if (db && userId && isAuthReady) {
  //     const chatCollectionRef = collection(db, 'chat_sessions');
  //     const q = query(chatCollectionRef, where("userId", "==", userId));

  //     const unsubscribe = onSnapshot(q, (snapshot) => {
  //       const sessions = [];
  //       snapshot.forEach((doc) => {
  //         sessions.push({ id: doc.id, ...doc.data() });
  //       });

  //       // Assuming one chat session per user for simplicity, take the first one
  //       if (sessions.length > 0) {
  //         setChatHistory(sessions[0].messages || []);
  //       } else {
  //         setChatHistory([]); // No existing session
  //       }
  //       scrollToBottom();
  //     }, (error) => {
  //       console.error("Error fetching chat history:", error);
  //     });

  //     return () => unsubscribe(); // Clean up listener on unmount
  //   }
  // }, [db, userId, isAuthReady]); // Re-run when db, userId, or isAuthReady changes

useEffect(() => {
  let unsubscribe = null;

  const setupChatSession = async () => {
    if (!db || !userId || !isAuthReady) {
      console.log('⏳ Waiting for Firebase to be ready...');
      return;
    }

    try {
      console.log('🔥 Setting up chat session for user:', userId);
      console.log('🔍 Database instance:', db);

      // First, try a simple test to see if we can create a document
      console.log('🧪 Testing basic Firestore write operation...');
      const testCollectionRef = collection(db, 'test');
      const testDoc = await addDoc(testCollectionRef, {
        test: true,
        timestamp: new Date().toISOString(),
        userId: userId
      });
      console.log('✅ Basic write test successful:', testDoc.id);

      // Now try to read it back
      console.log('🧪 Testing basic Firestore read operation...');
      const testDocSnap = await getDoc(testDoc);
      if (testDocSnap.exists()) {
        console.log('✅ Basic read test successful:', testDocSnap.data());
      } else {
        console.log('⚠️ Basic read test failed - document not found');
      }

      // Now proceed with chat session setup
      console.log('📝 Creating new chat session...');
      const chatCollectionRef = collection(db, 'chat_sessions');
      const newChatDoc = await addDoc(chatCollectionRef, {
        userId,
        messages: [{
          role: 'ai',
          text: 'Hello! How can I help you today?'
        }],
        createdAt: new Date().toISOString()
      });
      console.log('✅ Chat session created:', newChatDoc.id);



      // Temporarily disable real-time listener to test basic operations
      console.log('� Loading initial chat data without real-time listener...');

      // Load initial data once
      const docSnap = await getDoc(newChatDoc);
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('📄 Document data loaded, messages count:', data?.messages?.length || 0);
        setChatHistory(data?.messages || []);
        scrollToBottom();
      } else {
        console.warn('⚠️ Document does not exist');
        // Set default message
        setChatHistory([{
          role: 'ai',
          text: 'Hello! How can I help you today?'
        }]);
      }

      console.log('✅ Chat session setup complete (without real-time listener)');
      setConnectionStatus('connected');

    } catch (error) {
      console.error('❌ Failed to setup chat session:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      setConnectionStatus('error');

      // Fallback: Set default chat history without Firestore
      setChatHistory([{
        role: 'ai',
        text: 'Hello! How can I help you today? (Note: Database connection issues detected - your chat history may not be saved, but I can still assist you!)'
      }]);
    }
  };

  setupChatSession();

  return () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  };
}, [db, userId, isAuthReady]);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // Network connectivity monitoring
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Network connection restored');
      if (connectionStatus === 'disconnected') {
        setConnectionStatus('connecting');
      }
    };

    const handleOffline = () => {
      console.log('🌐 Network connection lost');
      setConnectionStatus('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [connectionStatus]);

  // Function to send message to AI and save to Firestore
  const sendMessage = async () => {
    if (!chatInput.trim() || isLoading) return;

    // Allow sending messages even if Firestore is not available
    if (!db || !userId || !isAuthReady) {
      console.warn('⚠️ Firestore not ready, sending message without saving to database');
    }

    const userMessage = { role: 'user', text: chatInput };
    const updatedChatHistory = [...chatHistory, userMessage];
    setChatHistory(updatedChatHistory);
    setChatInput('');
    setIsLoading(true);
    setIsTyping(true);

    let sessionId = null;

    // Try to save to Firestore, but continue even if it fails
    if (db && userId && isAuthReady) {
      try {
        console.log('💾 Attempting to save message to Firestore...');

        // Find existing chat session
        const chatCollectionRef = collection(db, 'chat_sessions');
        const q = query(chatCollectionRef, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          sessionId = querySnapshot.docs[0].id;
          console.log('📁 Using existing session:', sessionId);
        } else {
          // Create new session
          const newDocRef = await addDoc(chatCollectionRef, {
            userId: userId,
            messages: [],
            createdAt: new Date().toISOString()
          });
          sessionId = newDocRef.id;
          console.log("✅ Created new chat session:", sessionId);
        }

        // Update messages in Firestore
        const sessionDocRef = doc(db, 'chat_sessions', sessionId);
        const cleanChatHistory = updatedChatHistory.map(msg => ({
          role: msg.role || 'user',
          text: msg.text || ''
        }));

        await updateDoc(sessionDocRef, { messages: cleanChatHistory });
        console.log("✅ Messages updated in Firestore");

      } catch (firestoreError) {
        console.error('❌ Firestore operation failed:', firestoreError);
        console.error('❌ Firestore error details:', {
          code: firestoreError.code,
          message: firestoreError.message
        });
        console.log('⚠️ Continuing without Firestore - messages will not be saved');
      }
    } else {
      console.log('⚠️ Firestore not available - messages will not be saved');
    }

    try {

      // Call Gemini API
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

      if (!apiKey) {
        throw new Error('Gemini API key not found. Please check your environment variables.');
      }

      // Correct Gemini API payload format
      const payload = {
        contents: [{
          parts: [{
            text: userMessage.text
          }]
        }]
      };

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      console.log('🤖 Calling Gemini API with payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('📡 Gemini API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini API error:', response.status, errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('🤖 Gemini API result:', result);

      if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
        const aiResponseText = result.candidates[0].content.parts[0].text;
        const aiMessage = { role: 'ai', text: aiResponseText };
        const finalChatHistory = [...updatedChatHistory, aiMessage];

        // Update UI immediately
        setChatHistory(finalChatHistory);
        console.log('✅ AI response processed successfully');

        // Try to save AI response to Firestore (optional)
        if (db && sessionId) {
          try {
            const sessionDocRef = doc(db, 'chat_sessions', sessionId);
            await updateDoc(sessionDocRef, { messages: finalChatHistory });
            console.log('✅ AI response saved to Firestore');
          } catch (firestoreError) {
            console.error('❌ Failed to save AI response to Firestore:', firestoreError);
            console.log('⚠️ AI response displayed but not saved to database');
          }
        }
      } else {
        console.error('❌ Unexpected Gemini API response structure:', result);
        throw new Error('Invalid API response structure');
      }

    } catch (error) {
      console.error("❌ Error sending message:", error);
      const errorMessage = "Sorry, I'm having trouble responding right now. Please try again.";
      const errorAiMessage = { role: 'ai', text: errorMessage };
      const finalChatHistory = [...updatedChatHistory, errorAiMessage];
      setChatHistory(finalChatHistory);

      // Try to save error message to Firestore (optional)
      if (db && userId && isAuthReady) {
        try {
          const chatCollectionRef = collection(db, 'chat_sessions');
          const q = query(chatCollectionRef, where("userId", "==", userId));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const sessionDocRef = doc(db, 'chat_sessions', querySnapshot.docs[0].id);
            await updateDoc(sessionDocRef, { messages: finalChatHistory });
            console.log('✅ Error message saved to Firestore');
          }
        } catch (firestoreError) {
          console.error("❌ Failed to save error message to Firestore:", firestoreError);
          console.log('⚠️ Error message displayed but not saved to database');
        }
      }
    } finally {
      // Always reset loading states
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  // Common styles for sections
  const sectionStyle = "py-16 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto";

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col">
      {/* Header */}
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
                onClick={() => setActiveSection('home')}
                className={`hover:text-blue-600 transition-colors duration-200 ${activeSection === 'home' ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}
              >
                Home
              </a>
            </li>
            <li>
              <a
                href="#services"
                onClick={() => setActiveSection('services')}
                className={`hover:text-blue-600 transition-colors duration-200 ${activeSection === 'services' ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}
              >
                Services
              </a>
            </li>
            <li>
              <a
                href="#about"
                onClick={() => setActiveSection('about')}
                className={`hover:text-blue-600 transition-colors duration-200 ${activeSection === 'about' ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}
              >
                About Michael
              </a>
            </li>
            <li>
              <a
                href="#contact"
                onClick={() => setActiveSection('contact')}
                className={`hover:text-blue-600 transition-colors duration-200 ${activeSection === 'contact' ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}
              >
                Contact
              </a>
            </li>
          </ul>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {/* Home Section - AI Agent Interaction */}
        <section id="home" className={`${sectionStyle} bg-gradient-to-br from-blue-50 to-indigo-100 rounded-b-xl shadow-inner`}>
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-4 animate-fade-in-down">
              Unlock Your Business Potential with AI-Powered Software
            </h1>
            <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto animate-fade-in-up">
              Metcalf.ai designs, builds, and deploys custom software to automate your business, increase sales, and achieve 5X productivity.
            </p>
            {userId && (
              <p className="text-sm text-gray-500 mt-4">
                Your current session ID: <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">{userId}</span>
              </p>
            )}

            {/* Connection Status Indicator */}
            <div className="mt-4 flex items-center justify-center">
              <div className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
                connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                connectionStatus === 'disconnected' ? 'bg-red-100 text-red-800' :
                'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  connectionStatus === 'connected' ? 'bg-green-500' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                  connectionStatus === 'disconnected' ? 'bg-red-500' :
                  'bg-red-500'
                }`}></div>
                {connectionStatus === 'connected' ? 'Connected' :
                 connectionStatus === 'connecting' ? 'Connecting...' :
                 connectionStatus === 'disconnected' ? 'Disconnected' :
                 'Connection Error'}
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-center lg:items-start lg:space-x-12">
            {/* AI Agent Interface */}
            <div className="w-full lg:w-2/3 bg-white p-6 md:p-8 rounded-xl shadow-lg border border-blue-200 flex flex-col h-[500px] animate-scale-in">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Meet Your AI Assistant</h2>
              <div className="flex-grow overflow-y-auto border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50 custom-scrollbar">
                {chatHistory.length === 0 ? (
                  <div className="text-center text-gray-500 italic mt-8">
                    <p>Hello! I'm your AI assistant from Metcalf.ai.</p>
                    <p>I can see (if you describe), hear (your text), and talk (respond to your queries).</p>
                    <p>Ask me anything about how Metcalf.ai can help your business!</p>
                  </div>
                ) : (
                  chatHistory.map((msg, index) => (
                    <div key={index} className={`mb-3 p-3 rounded-lg max-w-[80%] ${msg.role === 'user' ? 'bg-blue-100 text-blue-900 ml-auto' : 'bg-gray-200 text-gray-800 mr-auto'}`}>
                      <p className="font-semibold">{msg.role === 'user' ? 'You' : 'AI'}:</p>
                      <p>{msg.text}</p>
                    </div>
                  ))
                )}
                {isTyping && (
                  <div className="mb-3 p-3 rounded-lg bg-gray-200 text-gray-800 mr-auto max-w-[80%]">
                    <p className="font-semibold">AI:</p>
                    <p className="italic">Typing...</p>
                  </div>
                )}
                <div ref={chatMessagesEndRef} />
              </div>
              <div className="flex">
                <input
                  type="text"
                  className="flex-grow border border-gray-300 rounded-l-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={isLoading ? "AI is thinking..." : "Type your message here..."}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') sendMessage();
                  }}
                  disabled={!isAuthReady || isTyping || isLoading}
                />
                <button
                  onClick={sendMessage}
                  className="bg-blue-600 text-white px-6 py-3 rounded-r-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!isAuthReady || isTyping || isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send'}
                </button>
              </div>
              {!isAuthReady && (
                 <p className="text-sm text-red-500 mt-2 text-center">
                   Initializing AI agent... Please wait.
                 </p>
              )}
            </div>

            {/* Value Proposition Cards */}
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
        <section id="services" className={`${sectionStyle} bg-white rounded-xl shadow-lg mt-8`}>
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
        <section id="about" className={`${sectionStyle} bg-gray-100 rounded-xl shadow-lg mt-8`}>
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">About Michael Metcalf</h2>
          <div className="flex flex-col md:flex-row items-center md:space-x-12">
            <div className="md:w-1/3 mb-8 md:mb-0">
              <img
                src="https://placehold.co/300x300/E0E7FF/3B82F6?text=Michael+Metcalf"
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
        <section id="contact" className={`${sectionStyle} bg-blue-600 text-white rounded-xl shadow-lg mt-8`}>
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
              onClick={() => setActiveSection('home')} // Direct to AI agent
              className="bg-blue-800 text-white px-8 py-4 rounded-full text-xl font-semibold shadow-lg hover:bg-blue-900 hover:scale-105 transition-all duration-300 flex items-center"
            >
              <i className="fas fa-comments mr-3"></i> Talk to Our AI
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
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

      {/* Font Awesome for Icons */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" crossOrigin="anonymous" referrerPolicy="no-referrer" />
      {/* Inter Font */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

    </div>
  );
};

export default App;
