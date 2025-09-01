import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/useIsMobile";

const VideoDemo = () => {
  const isMobile = useIsMobile();

  return (
    <section className="relative bg-background pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'} font-bold mb-6 text-body-text`}>
            Zobacz Autaro.pl w Akcji
          </h2>
          <p className={`text-subtitle-text ${isMobile ? 'text-base' : 'text-lg'} max-w-3xl mx-auto`}>
            Odkryj jak łatwo i szybko możesz kupować samochody na naszej platformie aukcyjnej
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative rounded-lg overflow-hidden shadow-lg bg-secondary/20 p-2">
            <div style={{
              position: 'relative',
              boxSizing: 'content-box',
              maxHeight: '80vh',
              width: '100%',
              aspectRatio: '1.7733990147783252',
              padding: isMobile ? '20px 0' : '40px 0'
            }}>
              <iframe
                src="https://app.supademo.com/embed/cmex5bp748owvv9kq9exi9083?embed_v=2&utm_source=embed"
                loading="lazy"
                title="FINAL VIDEO AUTARO"
                allow="clipboard-write"
                frameBorder="0"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  borderRadius: '8px'
                }}
                {...({
                  webkitallowfullscreen: "true",
                  mozallowfullscreen: "true"
                } as any)}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default VideoDemo;