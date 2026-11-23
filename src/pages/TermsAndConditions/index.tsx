import { Link } from 'react-router-dom'

const SECTIONS = [
  {
    id: 'program-nature',
    title: '1. Program Nature',
    content: (
      <>
        <p>
          This is an online nutrition guidance program delivered via app, phone
          call, messages, or email.
        </p>
        <p>
          The program focuses on diet, fitness, lifestyle guidance, and habit
          modification. Results may vary from person to person depending on
          compliance, lifestyle, metabolism, and health conditions.
        </p>
      </>
    ),
  },
  {
    id: 'not-a-medical-treatment',
    title: '2. Not A Medical Treatment',
    content: (
      <p>
        This program is not a substitute for medical treatment, diagnosis, or
        medication. Clients with medical conditions (e.g., diabetes, fatty
        liver, vitamin deficiency, hypertension, thyroid disorders, PCOS,
        pregnancy, lactation, eating disorders, or any chronic illness) must
        inform the nutritionist before starting. Always consult your physician
        before making major dietary changes.
      </p>
    ),
  },
  {
    id: 'client-responsibility',
    title: '3. Client Responsibility',
    content: (
      <>
        <p>
          Clients must provide accurate and complete health, lifestyle, fitness,
          and dietary information. The nutritionist will not be responsible for
          outcomes affected by incomplete, false, or withheld information.
        </p>
        <p>
          Following the diet plan, lifestyle advice, and check-ins is the
          client&apos;s responsibility.
        </p>
      </>
    ),
  },
  {
    id: 'program-duration-access',
    title: '4. Program Duration & Access',
    content: (
      <>
        <p>The program duration is as specified at the time of purchase.</p>
        <p>
          Support is limited to the agreed period only. Missed consultations or
          follow-ups will not be extended unless previously discussed.
        </p>
      </>
    ),
  },
  {
    id: 'communication',
    title: '5. Communication',
    content: (
      <>
        <p>
          Communication will be via agreed platforms (calls, WhatsApp, or
          Botim).
        </p>
        <p>
          Response time may vary and is typically within 24-48 working hours.
        </p>
        <p>
          Emergency or medical issues should be addressed to a healthcare
          professional, not through program messaging.
        </p>
      </>
    ),
  },
  {
    id: 'payments-refund-policy',
    title: '6. Payments & Refund Policy',
    content: (
      <>
        <p>Full payment must be made in advance to confirm enrollment.</p>
        <p>
          Fees are non-refundable and non-transferable once the program has
          started.
        </p>
        <p>
          No refunds will be issued for partial participation or non-compliance.
        </p>
      </>
    ),
  },
  {
    id: 'results-disclaimer',
    title: '7. Results Disclaimer',
    content: (
      <p>
        Weight loss, inch loss, or health improvements are not guaranteed.
        Progress depends on consistency, adherence, physical activity, sleep,
        stress levels, and individual body response.
      </p>
    ),
  },
  {
    id: 'plan-customisation-changes',
    title: '8. Plan Customisation & Changes',
    content: (
      <>
        <p>
          Diet plans, workout plans, yoga plans, and meditation are personalized
          based on the information provided.
        </p>
        <p>
          Requests for frequent or major changes beyond program scope may
          include additional charges.
        </p>
      </>
    ),
  },
  {
    id: 'intellectual-property',
    title: '9. Intellectual Property',
    content: (
      <p>
        All diet plans, workout plans, yoga plans, materials, recipes, and
        content provided are for personal use only. Sharing, reproducing, or
        distributing program content without permission is strictly prohibited.
      </p>
    ),
  },
  {
    id: 'termination',
    title: '10. Termination',
    content: (
      <>
        <p>
          The nutritionist reserves the right to discontinue the program if:
        </p>
        <ul>
          <li>There is repeated non-compliance.</li>
          <li>Abusive or disrespectful behavior.</li>
          <li>Non-adherence to Terms &amp; Conditions.</li>
        </ul>
        <p>No refunds will be provided in such cases.</p>
      </>
    ),
  },
  {
    id: 'acceptance',
    title: '11. Acceptance',
    content: (
      <p>
        Enrollment and payment confirm that you have read, understood, and
        agreed to these TERMS &amp; CONDITIONS.
      </p>
    ),
  },
]

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-green-50 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primaryBlue via-primaryPink to-primaryGreen opacity-95"></div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            to="/login"
            className="inline-block transform hover:scale-105 transition-transform duration-300"
          >
            <div className="relative">
              <div className="absolute -inset-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl blur opacity-75"></div>
              <div className="relative bg-white rounded-xl p-4 shadow-2xl border border-orange-100">
                <img
                  src="/gfm-logo.png"
                  alt="Get Fit Malayali"
                  className="w-20 h-20 object-contain"
                />
              </div>
            </div>
          </Link>
          <h1 className="mt-6 text-4xl font-bold text-white">
            Terms &amp; Conditions – Get Fit Malayali
          </h1>
          <p className="mt-2 text-white/80 text-sm">
            By enrolling in this online nutrition program, you agree to the
            following Terms &amp; Conditions.
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 lg:p-10">
          {SECTIONS.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              className={index === 0 ? '' : 'mt-8'}
            >
              <h2 className="text-2xl font-bold bg-gradient-to-r from-red-700 to-orange-600 bg-clip-text text-transparent mb-3">
                {section.title}
              </h2>
              <div className="space-y-3 text-neutral-700 leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_li]:text-neutral-700 [&_strong]:text-neutral-900">
                {section.content}
              </div>
            </section>
          ))}

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-neutral-200 text-center">
            <div className="flex items-center justify-center space-x-4 text-sm">
              <Link
                to="/login"
                className="inline-flex items-center text-red-600 hover:text-red-800 font-semibold transition-colors duration-200 hover:underline"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Login
              </Link>
              <span className="text-neutral-300">|</span>
              <Link
                to="/privacy-policy"
                className="text-red-600 hover:text-red-800 font-semibold transition-colors duration-200 hover:underline"
              >
                Privacy Policy
              </Link>
            </div>
            <p className="mt-3 text-xs text-neutral-400">
              Powered by Get Fit Malayali
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
