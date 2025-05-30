// File: src/pages/Home.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const rotatingImages = [
  '/banner1.jpg',
  '/banner2.webp',
  '/banner3.jpg'
];

const Home = () => {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % rotatingImages.length);
    }, 4000); // 4 seconds per image
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      style={{
        padding: '60px 20px',
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
        backgroundImage: 'url("/background.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
      }}
    >
      {/* Floating Logo (below navbar) */}
      <motion.img
        src="/MNA.png"
        alt="MNA Logo"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        style={{
          height: '60px',
          width: '60px',
          borderRadius: '50%',
          objectFit: 'cover',
          backgroundColor: '#fff',
          padding: '6px',
          position: 'fixed',
          top: '80px', // below navbar
          left: '10px',
          zIndex: 999,
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }}
      />

      {/* Rotating Banner Image Box */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        style={{
          width: '90%',
          maxWidth: '800px',
          margin: '0 auto 30px',
          height: '250px',
          borderRadius: '15px',
          overflow: 'hidden',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
          backgroundColor: '#fff',
        }}
      >
        <img
          src={rotatingImages[currentImage]}
          alt="Highlight"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
        />
      </motion.div>

     {/* Heading */}
<motion.h1
  initial={{ x: -50, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ delay: 0.4, duration: 0.8 }}
  style={{
    fontSize: '2.8rem',
    marginBottom: '24px',
    color: '#ffffff',
    textShadow: '1px 1px 3px rgba(0,0,0,0.6)',
  }}
>
  Welcome to the Digital Degree Issuance System
</motion.h1>

{/* Description */}
<motion.p
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.6, duration: 1 }}
  style={{
    fontSize: '1.2rem',
    maxWidth: '900px',
    margin: '0 auto 40px',
    lineHeight: '1.7',
    color: 'rgba(255, 255, 255, 0.9)',
    textShadow: '1px 1px 3px rgba(0,0,0,0.4)',
  }}
>
  Experience a revolutionary way to manage academic records with blockchain technology. Our platform ensures
  secure student registration, biometric attendance tracking, automated grading, and transparent degree issuance.
  Join us in modernizing academic integrity and efficiency.
</motion.p>


     

      
    </motion.div>
  );
};




export default Home;
