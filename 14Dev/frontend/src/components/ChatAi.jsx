// // import { useState, useRef, useEffect } from "react";
// // import { useForm } from "react-hook-form";
// // import axiosClient from "../utils/axiosClient";
// // import { Send } from 'lucide-react';

// // function ChatAi({problem}) {
// //     const [messages, setMessages] = useState([
// //         { role: 'model', parts:[{text: "Hi, How are you"}]},
// //         { role: 'user', parts:[{text: "I am Good"}]}
// //     ]);

// //     const { register, handleSubmit, reset,formState: {errors} } = useForm();
// //     const messagesEndRef = useRef(null);

// //     useEffect(() => {
// //         messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });//hme naya message hi dikhega scroll karne ki jarurat nhi
// //     }, [messages]);

// //     const onSubmit = async (data) => {
        
// //         setMessages(prev => [...prev, { role: 'user', parts:[{text: data.message}] }]);
// //         reset();

// //         try {
            
// //             const response = await axiosClient.post("/ai/chat", {
// //                 messages:messages,
// //                 title:problem.title,
// //                 description:problem.description,
// //                 testCases: problem.visibleTestCases,
// //                 startCode:problem.startCode
// //             });

           
// //             setMessages(prev => [...prev, { 
// //                 role: 'model', 
// //                 parts:[{text: response.data.message}] 
// //             }]);
// //         } catch (error) {
// //             console.error("API Error:", error);
// //             setMessages(prev => [...prev, { 
// //                 role: 'model', 
// //                 parts:[{text: "Error from AI Chatbot"}]////saare message ko khol diya  aur nya msg bhej dia
// //             }]);
// //         }
// //     };

// //     return (
// //         <div className="flex flex-col h-screen max-h-[80vh] min-h-[500px]">
// //             <div className="flex-1 overflow-y-auto p-4 space-y-4">
// //                 {messages.map((msg, index) => (
// //                     <div 
// //                         key={index} 
// //                         className={`chat ${msg.role === "user" ? "chat-end" : "chat-start"}`}//agar wo useser ha to uska msg left ma agar wo AI ha to uska msg  left me
// //                     >
// //                         <div className="chat-bubble bg-base-200 text-base-content">
// //                             {msg.parts[0].text}
// //                         </div>
// //                     </div>
// //                 ))}
// //                 <div ref={messagesEndRef} />
// //             </div>
// //             <form 
// //                 onSubmit={handleSubmit(onSubmit)} 
// //                 className="sticky bottom-0 p-4 bg-base-100 border-t"
// //             >
// //                 <div className="flex items-center">
// //                     <input 
// //                         placeholder="Ask me anything" 
// //                         className="input input-bordered flex-1" 
// //                         {...register("message", { required: true, minLength: 2 })}
// //                     />
// //                     <button 
// //                         type="submit" 
// //                         className="btn btn-ghost ml-2"
// //                         disabled={errors.message}
// //                     >
// //                         <Send size={20} />
// //                     </button>
// //                 </div>
// //             </form>
// //         </div>
// //     );
// // }

// // export default ChatAi;


// import { useState, useRef, useEffect } from "react";
// import { useForm } from "react-hook-form";
// import axiosClient from "../utils/axiosClient";
// import { Send } from 'lucide-react';

// function ChatAi({ problem }) {
//     const [messages, setMessages] = useState([
//         { role: 'model', parts: [{ text: "Hello! I'm your DSA assistant. I can help you with hints, code review, and explanations for this problem. What would you like to know?" }] }
//     ]);
    
//     const [isLoading, setIsLoading] = useState(false);
    
//     const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
//     const messagesEndRef = useRef(null);

//     useEffect(() => {
//         messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//     }, [messages]);

//     const onSubmit = async (data) => {
//         if (!data.message.trim()) return;
        
//         const userMessage = { 
//             role: 'user', 
//             parts: [{ text: data.message }] 
//         };
        
//         // Add user message immediately for better UX
//         setMessages(prev => [...prev, userMessage]);
//         reset();
//         setIsLoading(true);
        
//         try {
//             // Create updated messages array including the new user message
//             const messagesForApi = [...messages, userMessage];
            
//             const response = await axiosClient.post("/ai/chat", {
//                 messages: messagesForApi,
//                 title: problem?.title || "Coding Problem",
//                 description: problem?.description || "",
//                 testCases: problem?.visibleTestCases || [],
//                 startCode: problem?.startCode || ""
//             });
            
//             // Add AI response
//             setMessages(prev => [...prev, { 
//                 role: 'model', 
//                 parts: [{ text: response.data.message }] 
//             }]);
            
//         } catch (error) {
//             console.error("API Error:", error);
//             let errorMessage = "Sorry, I encountered an error. Please try again.";
            
//             if (error.response) {
//                 errorMessage = `Error: ${error.response.data?.message || "Server error"}`;
//             } else if (error.request) {
//                 errorMessage = "No response from server. Please check your connection.";
//             }
            
//             setMessages(prev => [...prev, { 
//                 role: 'model', 
//                 parts: [{ text: errorMessage }]
//             }]);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <div className="flex flex-col h-screen max-h-[80vh] min-h-[500px]">
//             {/* Messages Container */}
//             <div className="flex-1 overflow-y-auto p-4 space-y-4">
//                 {messages.map((msg, index) => (
//                     <div 
//                         key={index} 
//                         className={`chat ${msg.role === "user" ? "chat-end" : "chat-start"}`}
//                     >
//                         <div className={`chat-header mb-1 ${msg.role === "user" ? "text-right" : "text-left"}`}>
//                             <span className="text-xs opacity-70">
//                                 {msg.role === "user" ? "You" : "AI Assistant"}
//                             </span>
//                         </div>
//                         <div className={`chat-bubble ${msg.role === "user" ? "bg-primary text-primary-content" : "bg-base-200 text-base-content"}`}>
//                             {msg.parts[0].text}
//                             {index === messages.length - 1 && msg.role === 'model' && isLoading && (
//                                 <span className="loading loading-dots loading-xs ml-2"></span>
//                             )}
//                         </div>
//                     </div>
//                 ))}
//                 <div ref={messagesEndRef} />
//             </div>
            
//             {/* Input Form */}
//             <form 
//                 onSubmit={handleSubmit(onSubmit)} 
//                 className="sticky bottom-0 p-4 bg-base-100 border-t"
//             >
//                 <div className="flex items-center gap-2">
//                     <input 
//                         placeholder="Ask me about the problem..." 
//                         className="input input-bordered flex-1" 
//                         {...register("message", { 
//                             required: "Message is required", 
//                             minLength: { 
//                                 value: 2, 
//                                 message: "Message must be at least 2 characters" 
//                             },
//                             maxLength: { 
//                                 value: 1000, 
//                                 message: "Message is too long (max 1000 characters)" 
//                             }
//                         })}
//                         disabled={isLoading}
//                     />
//                     <button 
//                         type="submit" 
//                         className="btn btn-primary min-w-[50px]"
//                         disabled={isLoading}
//                     >
//                         {isLoading ? (
//                             <span className="loading loading-spinner loading-sm"></span>
//                         ) : (
//                             <Send size={20} />
//                         )}
//                     </button>
//                 </div>
//                 {errors.message && (
//                     <p className="text-error text-sm mt-1 ml-1">{errors.message.message}</p>
//                 )}
//             </form>
//         </div>
//     );
// }

// export default ChatAi;

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import axiosClient from "../utils/axiosClient";
import { Send, Bot, User } from 'lucide-react';

function ChatAi({ problem }) {
    const [messages, setMessages] = useState([
        { role: 'model', parts: [{ text: "Hello! I'm your DSA assistant. I can help you with hints, code review, and explanations for this problem. What would you like to know?" }] }
    ]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [typingMessage, setTypingMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, typingMessage]);

    // Typing effect function
    const typeMessage = (text, callback) => {
        setIsTyping(true);
        let index = 0;
        const speed = 15; // typing speed in ms
        
        const type = () => {
            if (index < text.length) {
                setTypingMessage(text.substring(0, index + 1));
                index++;
                setTimeout(type, speed);
            } else {
                setIsTyping(false);
                setTypingMessage("");
                callback();
            }
        };
        
        type();
    };

    const onSubmit = async (data) => {
        if (!data.message.trim()) return;
        
        const userMessage = { 
            role: 'user', 
            parts: [{ text: data.message }] 
        };
        
        setMessages(prev => [...prev, userMessage]);
        reset();
        setIsLoading(true);
        
        try {
            const messagesForApi = [...messages, userMessage];
            
            const response = await axiosClient.post("/ai/chat", {
                messages: messagesForApi,
                title: problem?.title || "Coding Problem",
                description: problem?.description || "",
                testCases: problem?.visibleTestCases || [],
                startCode: problem?.startCode || ""
            });
            
            // Use typing effect for AI response
            const aiResponse = response.data.message;
            typeMessage(aiResponse, () => {
                setMessages(prev => [...prev, { 
                    role: 'model', 
                    parts: [{ text: aiResponse }] 
                }]);
            });
            
        } catch (error) {
            console.error("API Error:", error);
            let errorMessage = "Sorry, I encountered an error. Please try again.";
            
            if (error.response) {
                errorMessage = `Error: ${error.response.data?.message || "Server error"}`;
            } else if (error.request) {
                errorMessage = "No response from server. Please check your connection.";
            }
            
            typeMessage(errorMessage, () => {
                setMessages(prev => [...prev, { 
                    role: 'model', 
                    parts: [{ text: errorMessage }]
                }]);
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen max-h-[80vh] min-h-[500px] bg-[#1a1f2e]">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {messages.map((msg, index) => (
                    <div 
                        key={index} 
                        className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} animate-fadeIn`}
                    >
                        {/* Avatar */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            msg.role === "user" 
                                ? "bg-gradient-to-br from-blue-500 to-purple-600" 
                                : "bg-gradient-to-br from-gray-700 to-gray-800"
                        }`}>
                            {msg.role === "user" ? (
                                <User size={16} className="text-white" />
                            ) : (
                                <Bot size={16} className="text-blue-400" />
                            )}
                        </div>
                        
                        {/* Message Bubble */}
                        <div className={`flex flex-col max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                            <span className="text-xs text-gray-400 mb-1 px-1">
                                {msg.role === "user" ? "You" : "AI Assistant"}
                            </span>
                            <div className={`rounded-2xl px-4 py-3 shadow-lg ${
                                msg.role === "user" 
                                    ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-tr-sm" 
                                    : "bg-[#252b3d] text-gray-100 border border-gray-700 rounded-tl-sm"
                            }`}>
                                <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                                    {msg.parts[0].text}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                
                {/* Typing Indicator with Message */}
                {isTyping && (
                    <div className="flex items-start gap-3 animate-fadeIn">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                            <Bot size={16} className="text-blue-400" />
                        </div>
                        <div className="flex flex-col max-w-[75%]">
                            <span className="text-xs text-gray-400 mb-1 px-1">
                                AI Assistant
                            </span>
                            <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-[#252b3d] border border-gray-700 shadow-lg">
                                <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-100">
                                    {typingMessage}
                                    <span className="inline-block w-1 h-4 bg-blue-400 ml-1 animate-pulse"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Loading indicator when waiting for response */}
                {isLoading && !isTyping && (
                    <div className="flex items-start gap-3 animate-fadeIn">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                            <Bot size={16} className="text-blue-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-400 mb-1 px-1">
                                AI Assistant
                            </span>
                            <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-[#252b3d] border border-gray-700 shadow-lg">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>
            
            {/* Input Form */}
            <div className="border-t border-gray-700 bg-[#1e2433] p-4">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                            <input 
                                placeholder="Ask me about the problem..." 
                                className="w-full bg-[#252b3d] border border-gray-600 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                                {...register("message", { 
                                    required: "Message is required", 
                                    minLength: { 
                                        value: 2, 
                                        message: "Message must be at least 2 characters" 
                                    },
                                    maxLength: { 
                                        value: 1000, 
                                        message: "Message is too long (max 1000 characters)" 
                                    }
                                })}
                                disabled={isLoading}
                            />
                        </div>
                        <button 
                            type="submit" 
                            className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                                isLoading 
                                    ? "bg-gray-600 cursor-not-allowed" 
                                    : "bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg hover:shadow-xl"
                            }`}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Send size={20} className="text-white" />
                            )}
                        </button>
                    </div>
                    {errors.message && (
                        <p className="text-red-400 text-xs mt-2 ml-1 animate-fadeIn">{errors.message.message}</p>
                    )}
                </form>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}

export default ChatAi;
