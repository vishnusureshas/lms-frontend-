'use client';

import { motion } from 'framer-motion';
import { BookOpen, BarChart3, Shield, Users, Zap, Sparkles } from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Interactive Courses',
    description: 'Learn with hands-on projects and real-world scenarios.',
    gradient: 'from-blue-400 to-cyan-300',
  },
  {
    icon: BarChart3,
    title: 'Track Progress',
    description: 'Monitor your learning journey with detailed analytics.',
    gradient: 'from-purple-400 to-pink-400',
  },
  {
    icon: Shield,
    title: 'Secure Platform',
    description: 'Enterprise-grade security for your learning data.',
    gradient: 'from-emerald-400 to-cyan-300',
  },
  {
    icon: Users,
    title: 'Expert Instructors',
    description: 'Learn from industry professionals worldwide.',
    gradient: 'from-amber-400 to-orange-400',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

export default function AuthHero() {
  return (
    <div className="relative flex flex-col justify-center h-full px-8 lg:px-16 xl:px-20 py-12">
      {/* Gradient blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-blob" />
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-br from-cyan-500/15 to-blue-500/15 rounded-full blur-3xl animate-blob-slow" />
      <div className="absolute top-1/2 -right-20 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-blob-fast" />

      {/* Content */}
      <motion.div
        className="relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <motion.div variants={itemVariants} className="flex items-center gap-3 mb-10">
          <div className="relative">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-500 rounded-full border-2 border-dark-900" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">LearnStream</h2>
            <p className="text-xs text-dark-400">Premium Learning Platform</p>
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div variants={itemVariants} className="mb-6">
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight tracking-tight">
            <span className="text-white">Master Skills </span>
            <br />
            <span className="gradient-text">That Matter</span>
          </h1>
        </motion.div>

        {/* Description */}
        <motion.p variants={itemVariants} className="text-dark-300 text-lg leading-relaxed max-w-lg mb-12">
          Unlock your potential with expert-led courses, interactive projects, and a
          community of learners dedicated to growth.
        </motion.p>

        {/* Feature cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 max-w-xl">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="feature-card group"
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            >
              <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${feature.gradient} p-2 mb-3 shadow-lg group-hover:shadow-xl transition-shadow`}>
                <feature.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{feature.title}</h3>
              <p className="text-xs text-dark-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats bar */}
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-8 mt-12 pt-8 border-t border-white/[0.06]"
        >
          {[
            { value: '10K+', label: 'Students' },
            { value: '500+', label: 'Courses' },
            { value: '98%', label: 'Satisfaction' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-xl font-bold gradient-text-blue">{stat.value}</p>
              <p className="text-xs text-dark-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
