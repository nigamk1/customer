import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <p className="text-gray-600 mb-4">Last Updated: May 12, 2025</p>
        
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p>
              Welcome to HelpMate AI ("we," "our," or "us"). We are committed to protecting your privacy and the 
              information you share with us. This Privacy Policy explains how we collect, use, disclose, and safeguard 
              your information when you use our website, AI chatbot services, and related applications (collectively, "Services").
            </p>
            <p className="mt-4">
              HelpMate AI provides instant answers to customer questions, 24/7 support, and seamless escalation 
              to human agents when needed. In providing these Services, we may collect and process certain personal information.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-medium mb-2">2.1 Information You Provide</h3>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>
                <strong>Account Information:</strong> When you register, we collect your name, email address, password, phone number, and business name.
              </li>
              <li>
                <strong>Payment Information:</strong> When you subscribe to our paid services, we collect payment details, 
                billing information, and transaction history. Payment processing is handled by secure third-party payment processors.
              </li>
              <li>
                <strong>Chat Content:</strong> We store the conversations between your customers and our AI chatbot, 
                including any information shared during these interactions.
              </li>
              <li>
                <strong>Website Integration Data:</strong> Information about the websites where you integrate our chatbot, 
                including domain names and customization preferences.
              </li>
            </ul>
            
            <h3 className="text-xl font-medium mb-2">2.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>
                <strong>Usage Data:</strong> Information about how you and your customers interact with our Services, 
                including access times, pages viewed, and features used.
              </li>
              <li>
                <strong>Device Information:</strong> Information about the devices used to access our Services, 
                including IP addresses, browser types, operating systems, and device identifiers.
              </li>
              <li>
                <strong>Cookies and Similar Technologies:</strong> We use cookies and similar tracking technologies 
                to collect information about your browsing activities and preferences.
              </li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p>We use the information we collect for various purposes, including:</p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Providing, maintaining, and improving our Services</li>
              <li>Processing your payments and managing your subscription</li>
              <li>Training and improving our AI chatbot</li>
              <li>Personalizing your experience and providing customer support</li>
              <li>Communicating with you about service-related announcements</li>
              <li>Sending you marketing communications (with consent)</li>
              <li>Analyzing usage patterns to enhance our Services</li>
              <li>Protecting against fraudulent or unauthorized activity</li>
              <li>Complying with legal obligations</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Data Sharing and Disclosure</h2>
            <p>We may share your information with:</p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>
                <strong>Service Providers:</strong> Third-party vendors who perform services on our behalf, 
                such as payment processing, data analysis, and customer support.
              </li>
              <li>
                <strong>Business Partners:</strong> Companies we partner with to offer integrated services.
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law, court order, or governmental authority.
              </li>
              <li>
                <strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.
              </li>
              <li>
                <strong>With Consent:</strong> With your explicit consent for purposes not listed in this Privacy Policy.
              </li>
            </ul>
            <p>
              We do not sell your personal information to third parties for advertising or marketing purposes.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information 
              from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission 
              over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
            <p className="mt-4">
              Your payment information is processed by PCI-compliant payment processors and is not stored on our servers.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this 
              Privacy Policy, comply with legal obligations, resolve disputes, and enforce our agreements. Chat 
              histories are typically retained for a period of 12 months, after which they may be anonymized or deleted.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights and Choices</h2>
            <p>Depending on your location, you may have certain rights regarding your personal information, including:</p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Accessing and receiving a copy of your personal information</li>
              <li>Correcting inaccurate or incomplete information</li>
              <li>Deleting your personal information (subject to certain exceptions)</li>
              <li>Restricting or objecting to certain processing activities</li>
              <li>Data portability (receiving your data in a structured format)</li>
              <li>Withdrawing consent for processing based on consent</li>
            </ul>
            <p>
              To exercise these rights, please contact us at privacy@helpmateai.com. We will respond to your request 
              within the timeframe required by applicable law.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. International Data Transfers</h2>
            <p>
              Your personal information may be transferred to and processed in countries other than your country of 
              residence, where privacy laws may be different. We ensure appropriate safeguards are in place to protect 
              your information when transferred internationally.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
            <p>
              Our Services are not directed to individuals under the age of 18. We do not knowingly collect personal 
              information from children. If you become aware that a child has provided us with personal information, 
              please contact us, and we will take steps to delete such information.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Changes to this Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. 
              The updated policy will be posted on our website with an updated "Last Updated" date. Your continued use of 
              our Services after any changes indicates your acceptance of the updated Privacy Policy.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy practices, 
              please contact us at:
            </p>
            <p className="mt-4">
              <strong>Email:</strong> privacy@helpmateai.com<br />
              <strong>Address:</strong> HelpMate AI, #123 AI Plaza, Tech Valley, Bengaluru 560001, India<br />
              <strong>Phone:</strong> +91-8000-HelpMate (8000-435-7628)
            </p>
          </section>
        </div>
      </div>
      
      <div className="text-center mb-8">
        <Link to="/terms" className="text-primary hover:underline">
          View Terms of Service
        </Link>
      </div>
    </div>
  );
};

export default PrivacyPolicy;