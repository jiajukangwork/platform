// import { useState } from 'react';
// import { motion } from 'framer-motion';
// import { Send } from 'lucide-react';
// import Button from './Button';

// const ContactSection = () => {
//   const [formState, setFormState] = useState({
//     name: '',
//     email: '',
//     organization: '',
//     message: ''
//   });
  
//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;
//     setFormState(prev => ({ ...prev, [name]: value }));
//   };
  
//   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     console.log('Form submitted:', formState);
//     setFormState({
//       name: '',
//       email: '',
//       organization: '',
//       message: ''
//     });
//   };

//   return (
//     <section className="py-20 bg-white">
//       <div className="container mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="max-w-3xl mx-auto text-center mb-16">
//           <motion.h2 
//             className="text-3xl md:text-4xl font-serif font-bold text-gray-900"
//             initial={{ opacity: 0, y: 20 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5 }}
//             viewport={{ once: true, margin: "-100px" }}
//           >
//             联系我们
//           </motion.h2>
//           <motion.div 
//             className="w-24 h-1 bg-primary-600 mx-auto my-5"
//             initial={{ opacity: 0, width: 0 }}
//             whileInView={{ opacity: 1, width: 96 }}
//             transition={{ duration: 0.5, delay: 0.2 }}
//             viewport={{ once: true, margin: "-100px" }}
//           ></motion.div>
//           <motion.p 
//             className="text-lg text-gray-600 mt-6"
//             initial={{ opacity: 0 }}
//             whileInView={{ opacity: 1 }}
//             transition={{ duration: 0.5, delay: 0.3 }}
//             viewport={{ once: true, margin: "-100px" }}
//           >
//             对我们的研究感兴趣或想要合作？欢迎联系我们。
//           </motion.p>
//         </div>
        
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
//           <motion.div
//             initial={{ opacity: 0, x: -20 }}
//             whileInView={{ opacity: 1, x: 0 }}
//             transition={{ duration: 0.5 }}
//             viewport={{ once: true, margin: "-100px" }}
//           >
//             <h3 className="text-2xl font-serif font-bold text-gray-900 mb-6">联系方式</h3>
//             <div className="space-y-6">
//               <div>
//                 <h4 className="text-lg font-medium text-gray-900">研究咨询</h4>
//                 <p className="mt-2 text-gray-600">如果您对我们的研究有疑问或想讨论潜在合作。</p>
//                 <a href="mailto:research@cognixai.research" className="mt-1 inline-block text-primary-600 hover:text-primary-700 transition-colors">
//                   research@cognixai.research
//                 </a>
//               </div>
              
//               <div>
//                 <h4 className="text-lg font-medium text-gray-900">技术支持</h4>
//                 <p className="mt-2 text-gray-600">实验参与或技术问题的支持。</p>
//                 <a href="mailto:support@cognixai.research" className="mt-1 inline-block text-primary-600 hover:text-primary-700 transition-colors">
//                   support@cognixai.research
//                 </a>
//               </div>
              
//               <div>
//                 <h4 className="text-lg font-medium text-gray-900">媒体咨询</h4>
//                 <p className="mt-2 text-gray-600">媒体采访或相关问题。</p>
//                 <a href="mailto:media@cognixai.research" className="mt-1 inline-block text-primary-600 hover:text-primary-700 transition-colors">
//                   media@cognixai.research
//                 </a>
//               </div>
              
//               <div>
//                 <h4 className="text-lg font-medium text-gray-900">访问地址</h4>
//                 <p className="mt-2 text-gray-600">
//                   科技创新大道123号<br />
//                   创新园区A座<br />
//                   北京市 100000
//                 </p>
//               </div>
//             </div>
//           </motion.div>
          
//           <motion.div
//             initial={{ opacity: 0, x: 20 }}
//             whileInView={{ opacity: 1, x: 0 }}
//             transition={{ duration: 0.5, delay: 0.2 }}
//             viewport={{ once: true, margin: "-100px" }}
//           >
//             <h3 className="text-2xl font-serif font-bold text-gray-900 mb-6">发送消息</h3>
//             <form onSubmit={handleSubmit} className="space-y-6">
//               <div>
//                 <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
//                   姓名
//                 </label>
//                 <input
//                   type="text"
//                   id="name"
//                   name="name"
//                   value={formState.name}
//                   onChange={handleChange}
//                   required
//                   className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
//                 />
//               </div>
              
//               <div>
//                 <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
//                   邮箱
//                 </label>
//                 <input
//                   type="email"
//                   id="email"
//                   name="email"
//                   value={formState.email}
//                   onChange={handleChange}
//                   required
//                   className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
//                 />
//               </div>
              
//               <div>
//                 <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
//                   单位（可选）
//                 </label>
//                 <input
//                   type="text"
//                   id="organization"
//                   name="organization"
//                   value={formState.organization}
//                   onChange={handleChange}
//                   className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
//                 />
//               </div>
              
//               <div>
//                 <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
//                   消息内容
//                 </label>
//                 <textarea
//                   id="message"
//                   name="message"
//                   value={formState.message}
//                   onChange={handleChange}
//                   required
//                   rows={4}
//                   className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
//                 ></textarea>
//               </div>
              
//               <Button type="submit" variant="primary" className="w-full">
//                 发送消息
//                 <Send className="ml-2 h-4 w-4" />
//               </Button>
//             </form>
//           </motion.div>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default ContactSection;

import { motion } from 'framer-motion';

const ContactSection = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <motion.h2
            className="text-3xl md:text-4xl font-serif font-bold text-gray-900"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            联系我们
          </motion.h2>

          <motion.div
            className="w-24 h-1 bg-primary-600 mx-auto my-5"
            initial={{ opacity: 0, width: 0 }}
            whileInView={{ opacity: 1, width: 96 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true, margin: "-100px" }}
          />

          <motion.p
            className="text-lg text-gray-700 mt-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            如有任何问题或合作意向，请通过以下方式与我们联系：
          </motion.p>

          <motion.div
            className="mt-8 space-y-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <p className="text-md text-gray-800">
              📧 邮箱：
              <a
                href="mailto:um.andlab@gmail.com"
                className="text-primary-600 hover:text-primary-700 underline transition-colors"
              >
                um.andlab@gmail.com
              </a>
            </p>

            <p className="text-md text-gray-800">
              🌐 网站：
              <a
                href="https://andlab-um.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 underline transition-colors"
              >
                andlab-um.com
              </a>
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
