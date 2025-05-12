import React from 'react';
import { Link } from 'react-router-dom';

const TermsOfService = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <p className="text-gray-600 mb-4">Last Updated: May 12, 2025</p>
        
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p>
              Welcome to HelpMate AI ("we," "us," "our," "HelpMate AI," or the "Company"). These Terms of Service 
              ("Terms") govern your access to and use of the HelpMate AI website and services, including any 
              applications, features, and content offered by HelpMate AI (collectively, the "Services").
            </p>
            <p className="mt-4">
              HelpMate AI provides instant answers to customer questions, 24/7 support, and seamless escalation to human 
              agents when needed. By using our Services, you agree to these Terms. Please read them carefully.
            </p>
            <p className="mt-4">
              These Terms constitute a legally binding agreement between you and HelpMate AI regarding your use of 
              the Services. By accessing or using our Services, you acknowledge that you have read, understood, and 
              agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Services.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Definitions</h2>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>"Account" means a unique account created for you to access our Services.</li>
              <li>"AI Chatbot" means the artificial intelligence-powered chatbot provided as part of our Services.</li>
              <li>"Customer" means any individual who interacts with the AI Chatbot deployed on your website or platform.</li>
              <li>"Subscription" means the paid access to our Services on a recurring basis.</li>
              <li>"Website" refers to HelpMate AI, accessible from www.helpmateai.com</li>
              <li>"You" refers to the individual accessing or using the Services, or the company or legal entity on behalf of which such individual is accessing or using the Services.</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Account Registration and Eligibility</h2>
            <p>
              To use certain features of our Services, you must register for an account. When you register, you agree to provide 
              accurate, current, and complete information about yourself and to keep this information updated. You are solely 
              responsible for maintaining the confidentiality of your account and password, and you accept responsibility for 
              all activities that occur under your account.
            </p>
            <p className="mt-4">
              You represent and warrant that:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>You are at least 18 years of age.</li>
              <li>You have the legal capacity and authority to enter into these Terms.</li>
              <li>If you represent a business or legal entity, you have the authority to bind that entity to these Terms.</li>
              <li>Your use of the Services will not violate any applicable law or regulation.</li>
            </ul>
            <p>
              We reserve the right to refuse service, terminate accounts, or cancel subscriptions at our sole discretion.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Subscription and Payments</h2>
            <h3 className="text-xl font-medium mb-2">4.1 Subscription Plans</h3>
            <p>
              HelpMate AI offers different subscription plans with varying features and limitations. The details of each plan, 
              including pricing and features, are available on our pricing page. We reserve the right to change our subscription 
              plans or pricing at any time, with notice provided to existing subscribers.
            </p>
            
            <h3 className="text-xl font-medium mb-2 mt-4">4.2 Free Trial</h3>
            <p>
              We may offer a free trial period for our Services. After the trial period expires, your account will automatically 
              convert to a paid subscription unless you cancel before the trial ends. You may be required to provide payment 
              information to start the free trial.
            </p>
            
            <h3 className="text-xl font-medium mb-2 mt-4">4.3 Payment Terms</h3>
            <p>
              By subscribing to our Services, you agree to pay all applicable fees for the subscription plan you select. 
              Payments are due in advance for each subscription period (monthly or yearly). All payments are non-refundable 
              except as expressly set forth in these Terms or as required by applicable law.
            </p>
            <p className="mt-2">
              You authorize us to charge your designated payment method for all fees related to your subscription. If your 
              payment cannot be processed, we may suspend or terminate your access to the Services.
            </p>
            
            <h3 className="text-xl font-medium mb-2 mt-4">4.4 Subscription Cancellation</h3>
            <p>
              You may cancel your subscription at any time through your account settings or by contacting our customer support. 
              When you cancel, you will continue to have access to the Services until the end of your current billing period, 
              after which your access will be terminated. We do not provide refunds for partial subscription periods.
            </p>
            
            <h3 className="text-xl font-medium mb-2 mt-4">4.5 Taxes</h3>
            <p>
              All fees are exclusive of taxes, unless stated otherwise. You are responsible for paying all taxes associated 
              with your subscription, excluding taxes based on HelpMate AI's net income.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. AI Chatbot Use and Limitations</h2>
            <p>
              Our Services include an AI Chatbot designed to provide automated customer support for your business. You understand 
              and agree to the following regarding AI Chatbot usage:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>
                <strong>Usage Limits:</strong> Depending on your subscription plan, there may be limits on the number of 
                chat interactions allowed per month. Exceeding these limits may result in additional charges or temporary 
                limitation of service.
              </li>
              <li>
                <strong>Content Limitations:</strong> The AI Chatbot is not designed to provide financial, legal, medical, 
                or other professional advice. You should not rely on the AI Chatbot for such purposes.
              </li>
              <li>
                <strong>Training and Customization:</strong> You are responsible for training and customizing the AI Chatbot 
                with accurate information about your business. We are not responsible for inaccurate or inappropriate responses 
                resulting from incorrect training data provided by you.
              </li>
              <li>
                <strong>Human Escalation:</strong> Some issues may require escalation to human support. You are responsible 
                for ensuring adequate human support resources are available when needed.
              </li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Website Integration</h2>
            <p>
              Our Services allow you to integrate the AI Chatbot into your website through our provided code snippet. You agree that:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>
                You will only integrate the chatbot on websites that you own or have proper authorization to modify.
              </li>
              <li>
                You will not modify the integration code in a way that compromises security, functionality, or our branding 
                (unless permitted by your subscription plan).
              </li>
              <li>
                You will inform your website visitors that they are interacting with an AI Chatbot and about any data 
                collection practices in accordance with applicable privacy laws.
              </li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Prohibited Uses</h2>
            <p>
              You agree not to use the Services in any way that:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Violates any applicable law or regulation</li>
              <li>Infringes on the rights of any third party</li>
              <li>Promotes illegal or harmful activities</li>
              <li>Attempts to decompile, reverse engineer, or otherwise attempt to obtain the source code of the Services</li>
              <li>Interferes with or disrupts the integrity or performance of the Services</li>
              <li>Attempts to gain unauthorized access to the Services or related systems</li>
              <li>Uses the Services to transmit spam, chain letters, or other unsolicited communications</li>
              <li>Uses the Services to collect or harvest personal information about users without their consent</li>
              <li>Uses the Services for any purpose that is harmful, fraudulent, deceptive, threatening, harassing, defamatory, or otherwise objectionable</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Intellectual Property Rights</h2>
            <h3 className="text-xl font-medium mb-2">8.1 Our Intellectual Property</h3>
            <p>
              The Services, including all content, features, and functionality, are owned by HelpMate AI or its licensors 
              and are protected by copyright, trademark, and other intellectual property laws. You may not use our trademarks, 
              logos, or other proprietary information without our prior written consent.
            </p>
            
            <h3 className="text-xl font-medium mb-2 mt-4">8.2 Your Content</h3>
            <p>
              You retain all rights to any content you provide to customize or train the AI Chatbot ("Your Content"). 
              By providing Your Content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, 
              modify, adapt, publish, and display Your Content solely for the purpose of providing and improving the Services.
            </p>
            
            <h3 className="text-xl font-medium mb-2 mt-4">8.3 Feedback</h3>
            <p>
              If you provide us with feedback or suggestions regarding the Services, you grant us an unlimited, irrevocable, 
              perpetual, sublicensable, transferable, royalty-free right to use such feedback for any purpose.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Data Protection and Privacy</h2>
            <p>
              Your privacy is important to us. Our Privacy Policy, available at 
              <Link to="/privacy" className="text-primary hover:underline"> https://www.helpmateai.com/privacy</Link>, describes 
              how we collect, use, and disclose information about you and your customers when you use our Services. By using 
              the Services, you agree to the collection and use of information in accordance with our Privacy Policy.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Disclaimer of Warranties</h2>
            <p className="font-bold">
              THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, 
              INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, 
              OR THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
            </p>
            <p className="mt-4">
              WE DO NOT WARRANT THAT THE AI CHATBOT WILL ALWAYS PROVIDE ACCURATE OR APPROPRIATE RESPONSES. YOU ACKNOWLEDGE 
              THAT AI TECHNOLOGY HAS LIMITATIONS AND MAY SOMETIMES GENERATE INCORRECT OR INAPPROPRIATE CONTENT. YOU ARE 
              RESPONSIBLE FOR MONITORING AND REVIEWING THE CHATBOT'S INTERACTIONS WITH YOUR CUSTOMERS.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Limitation of Liability</h2>
            <p className="font-bold">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, HELPMATE AI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, 
              OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICES.
            </p>
            <p className="mt-4 font-bold">
              IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS EXCEED THE AMOUNT PAID BY YOU TO HELPMATE AI FOR THE 
              SERVICES DURING THE TWELVE (12) MONTH PERIOD PRIOR TO THE EVENT GIVING RISE TO LIABILITY.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold harmless HelpMate AI, its officers, directors, employees, and agents, 
              from and against any claims, liabilities, damages, losses, and expenses, including without limitation reasonable 
              legal and accounting fees, arising out of or in any way connected with your access to or use of the Services, 
              your violation of these Terms, or your violation of any third-party rights.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Term and Termination</h2>
            <p>
              These Terms will remain in full force and effect while you use the Services. We may terminate or suspend your 
              account and access to the Services immediately, without prior notice or liability, for any reason, including 
              if you breach these Terms. Upon termination, your right to use the Services will immediately cease.
            </p>
            <p className="mt-4">
              All provisions of the Terms which by their nature should survive termination shall survive termination, 
              including, without limitation, ownership provisions, warranty disclaimers, indemnification, and limitations of liability.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Changes to Terms</h2>
            <p>
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide 
              at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined 
              at our sole discretion.
            </p>
            <p className="mt-4">
              By continuing to access or use our Services after those revisions become effective, you agree to be bound by the 
              revised Terms. If you do not agree to the new Terms, you must stop using the Services.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">15. Governing Law and Dispute Resolution</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India, without regard to its 
              conflict of laws principles. Any dispute arising out of or relating to these Terms or the Services shall be 
              subject to the exclusive jurisdiction of the courts located in Bengaluru, India.
            </p>
            <p className="mt-4">
              You agree to first attempt to resolve any disputes informally by contacting us. If a dispute cannot be resolved 
              informally, either party may initiate formal proceedings.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">16. General Provisions</h2>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>
                <strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and HelpMate AI 
                regarding the Services and supersede all prior agreements and understandings.
              </li>
              <li>
                <strong>Waiver:</strong> No waiver of any term of these Terms shall be deemed a further or continuing waiver 
                of such term or a waiver of any other term.
              </li>
              <li>
                <strong>Severability:</strong> If any provision of these Terms is held to be invalid or unenforceable, such 
                provision shall be struck and the remaining provisions shall be enforced.
              </li>
              <li>
                <strong>Assignment:</strong> You may not assign or transfer these Terms without the prior written consent of HelpMate AI. 
                HelpMate AI may assign or transfer these Terms without restriction.
              </li>
              <li>
                <strong>Force Majeure:</strong> HelpMate AI shall not be liable for any failure or delay in performance resulting 
                from causes beyond its reasonable control.
              </li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">17. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <p className="mt-4">
              <strong>Email:</strong> legal@helpmateai.com<br />
              <strong>Address:</strong> HelpMate AI, #123 AI Plaza, Tech Valley, Bengaluru 560001, India<br />
              <strong>Phone:</strong> +91-8000-HelpMate (8000-435-7628)
            </p>
          </section>
        </div>
      </div>
      
      <div className="text-center mb-8">
        <Link to="/privacy" className="text-primary hover:underline">
          View Privacy Policy
        </Link>
      </div>
    </div>
  );
};

export default TermsOfService;