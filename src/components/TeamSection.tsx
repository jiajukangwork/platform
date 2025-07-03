import { motion } from 'framer-motion';
import { Twitter, Linkedin, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';

const TeamSection = () => {
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const response = await fetch('/data/team-members.json');
        const data = await response.json();
        setTeamMembers(data);
      } catch (error) {
        console.error('Failed to load team members:', error);
        // 可以设置默认数据或显示错误信息
        setTeamMembers([
          {
            name: "张教授",
            role: "首席研究员，认知科学",
            image: "https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
            bio: "专注于人类决策过程研究和认知偏差分析，拥有15年研究经验。",
            social: {
              twitter: "#",
              linkedin: "#",
              email: "zhang@cognixai.research"
            }
          }
        ]);
      }
    };

    fetchTeamData();
  }, []);

  return (
    <section id="team" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            className="text-3xl md:text-4xl font-serif font-bold text-gray-900"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            研究团队
          </motion.h2>
          <motion.div 
            className="w-24 h-1 bg-primary-600 mx-auto my-5"
            initial={{ opacity: 0, width: 0 }}
            whileInView={{ opacity: 1, width: 96 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true, margin: "-100px" }}
          ></motion.div>
          <motion.p 
            className="text-lg text-gray-600 mt-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            我们的跨学科研究团队致力于推进人类决策建模、多智能体模拟和脑机接口多模态融合研究。
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
            <TeamMemberCard 
              key={index}
              name={member.name}
              role={member.role}
              image={member.image}
              bio={member.bio}
              social={member.social}
              delay={index * 0.1}
            />
          ))}
        </div>
        
        <motion.div
          className="mt-16 p-8 md:p-12 bg-primary-900 text-white rounded-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <h3 className="text-2xl md:text-3xl font-serif font-bold">加入我们的研究团队</h3>
          <p className="mt-4 max-w-2xl mx-auto text-primary-100">
            我们始终欢迎优秀的研究人员和合作伙伴加入。如果您对人工智能、认知科学和人机交互研究充满热情，期待您的加入。
          </p>
          <a 
            href="#" 
            className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-900 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            申请加入
          </a>
        </motion.div>
      </div>
    </section>
  );
};

const TeamMemberCard = ({ name, role, image, bio, social, delay }: {
  name: string;
  role: string;
  image: string;
  bio: string;
  social: { twitter?: string; linkedin?: string; email?: string; };
  delay: number;
}) => {
  return (
    <motion.div
      className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <img className="w-full h-52 object-cover rounded-xl mb-4" src={image} alt={name} />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{name}</h3>
      <p className="text-sm text-gray-700 mb-3">{role}</p>
      <p className="text-gray-600 line-clamp-3">{bio}</p>
      <div className="mt-4 flex space-x-3">
        {social?.twitter && <SocialLink href={social.twitter} icon="twitter" />}
        {social?.linkedin && <SocialLink href={social.linkedin} icon="linkedin" />}
        {social?.email && <SocialLink href={`mailto:${social.email}`} icon="mail" />}
      </div>
    </motion.div>
  );
};

const SocialLink = ({ href, icon }: { href: string; icon: string }) => {
  const getIcon = () => {
    switch (icon) {
      case 'twitter':
        return (
          <Twitter className="h-5 w-5 fill-current" />
        );
      case 'linkedin':
        return (
          <Linkedin className="h-5 w-5 fill-current" />
        );
      case 'mail':
        return (
          <Mail className="h-5 w-5 fill-current" />
        );
      default:
        return null;
    }
  };

  return (
    <a
      href={href}
      className="text-gray-400 hover:text-primary-400 transition-colors"
      aria-label={icon}
    >
      {getIcon()}
    </a>
  );
};

export default TeamSection;