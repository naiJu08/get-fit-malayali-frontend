import { useEffect } from 'react'
import { Link } from 'react-router-dom'

const SECTIONS = [
  {
    id: 'introduction',
    title: '1. Introduction',
    content: (
      <p>
        Welcome to Get Fit Malayali. We respect your privacy and are committed
        to protecting your personal data. This privacy policy will inform you as
        to how we look after your personal data when you visit our application
        and tell you about your privacy rights and how the law protects you.
      </p>
    ),
  },
  {
    id: 'data-we-collect',
    title: '2. Data We Collect',
    content: (
      <>
        <p>
          We may collect, use, store, and transfer different kinds of personal
          data about you which we have grouped together as follows:
        </p>
        <ul>
          <li>
            <strong>Identity Data:</strong> includes name, username or similar
            identifier, gender, date of birth.
          </li>
          <li>
            <strong>Health Data:</strong> includes weight, height, dietary
            preferences, allergies, medical conditions.
          </li>
          <li>
            <strong>Contact Data:</strong> includes email address and telephone
            numbers.
          </li>
          <li>
            <strong>Device Data:</strong> includes Internet Protocol (IP)
            address, your login data, browser type and version, time zone
            setting, and location.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'how-we-use-your-data',
    title: '3. How We Use Your Data',
    content: (
      <>
        <p>
          We will only use your personal data when the law allows us to. Most
          commonly, we will use your personal data in the following
          circumstances:
        </p>
        <ul>
          <li>To register you as a new customer.</li>
          <li>To personalize your diet and workout plans.</li>
          <li>To monitor your progress and adjust recommendations.</li>
          <li>
            To improve our website, products/services, marketing, customer
            relationships and experiences.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'data-security',
    title: '4. Data Security',
    content: (
      <p>
        We have put in place appropriate security measures to prevent your
        personal data from being accidentally lost, used or accessed in an
        unauthorized way, altered or disclosed. In addition, we limit access to
        your personal data to those employees, agents, contractors and other
        third parties who have a business need to know.
      </p>
    ),
  },
  {
    id: 'your-legal-rights',
    title: '5. Your Legal Rights',
    content: (
      <p>
        Under certain circumstances, you have rights under data protection laws
        in relation to your personal data, including the right to request
        access, correction, erasure, restriction, transfer, to object to
        processing, to portability of data and (where the lawful ground of
        processing is consent) to withdraw consent. To permanently erase your
        account and personal data, see{' '}
        <a
          href="#account-deletion"
          className="font-semibold text-red-600 hover:text-red-800 underline"
        >
          Account Deletion
        </a>
        .
      </p>
    ),
  },
  {
    id: 'account-deletion',
    title: '6. Account Deletion',
    content: (
      <>
        <p>
          You can delete your Get Fit Malayali account directly from the app:{' '}
          <strong>Profile → Delete Account</strong>. Deletion is immediate and
          permanent once confirmed.
        </p>
        <p>
          <strong>What data is deleted.</strong> When you delete your account,
          we permanently delete the following data associated with you:
        </p>
        <ul>
          <li>
            <strong>Identity Data:</strong> name, username or similar
            identifier, gender, date of birth.
          </li>
          <li>
            <strong>Health Data:</strong> weight, height, dietary preferences,
            allergies, medical conditions.
          </li>
          <li>
            <strong>Contact Data:</strong> email address and telephone numbers.
          </li>
          <li>
            <strong>Device Data:</strong> Internet Protocol (IP) address, login
            data, browser type and version, time zone setting, and location.
          </li>
          <li>
            Your diet plans, workout plans, progress records, and in-app
            messages.
          </li>
        </ul>
        <p>
          Deleted records are purged from our production systems within{' '}
          <strong>30 days</strong>, and from our encrypted backups within{' '}
          <strong>90 days</strong>.
        </p>
        <p>
          <strong>What is retained, and for how long.</strong> To meet legal and
          accounting obligations, the following data is retained after account
          deletion:
        </p>
        <ul>
          <li>
            <strong>Payment and invoice records:</strong> retained for{' '}
            <strong>up to 5 years</strong> from the date of the transaction to
            comply with tax and accounting laws. These records contain only the
            minimum information needed (payment reference, amount, date) and are
            not used for any other purpose.
          </li>
          <li>
            <strong>Deletion request records:</strong> retained for{' '}
            <strong>up to 30 days</strong> for verification and security
            purposes.
          </li>
          <li>
            <strong>
              Records required to resolve disputes, prevent fraud, or enforce
              our Terms &amp; Conditions:
            </strong>{' '}
            retained for as long as necessary to establish, exercise, or defend
            legal claims.
          </li>
          <li>
            <strong>Aggregated, anonymized statistics:</strong> that cannot
            identify you may be retained indefinitely for service improvement.
          </li>
        </ul>
        <p>
          After the applicable retention period expires, retained data is
          deleted or anonymized.
        </p>
        <p>
          <strong>Cannot access the app?</strong> If you cannot delete your
          account from the app, send a deletion request to{' '}
          <a
            href="mailto:support@getfitmalayali.com?subject=Account%20Deletion%20Request"
            className="font-semibold text-red-600 hover:text-red-800 underline"
          >
            support@getfitmalayali.com
          </a>{' '}
          from the email address registered to your account. We will verify your
          identity and complete the deletion within <strong>30 days</strong>.
        </p>
      </>
    ),
  },
  {
    id: 'contact-us',
    title: '7. Contact Us',
    content: (
      <p>
        If you have any questions about this privacy policy or our privacy
        practices, please contact us.
      </p>
    ),
  },
]

export default function PrivacyPolicy() {
  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (!hash) return
    // Wait a tick so the lazy-loaded page has painted before scrolling.
    const timer = window.setTimeout(() => {
      const el = document.getElementById(hash)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
    return () => window.clearTimeout(timer)
  }, [])

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
            Privacy Policy – Get Fit Malayali
          </h1>
          <p className="mt-2 text-white/80 text-sm">
            Your privacy matters to us. Learn how we collect, use and protect
            your data.
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
            <p className="text-xs text-neutral-500">
              We respect your privacy. Your information is safe with us.
            </p>
            <div className="mt-4 flex items-center justify-center space-x-4 text-sm">
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
                to="/terms-and-conditions"
                className="text-red-600 hover:text-red-800 font-semibold transition-colors duration-200 hover:underline"
              >
                Terms &amp; Conditions
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
