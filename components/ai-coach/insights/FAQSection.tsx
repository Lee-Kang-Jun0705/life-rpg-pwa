import { Card } from '@/components/ui/Card'

interface FAQ {
  q: string
  a: string
}

interface FAQSectionProps {
  faqs: FAQ[]
}

export function FAQSection({ faqs }: FAQSectionProps) {
  return (
    <div>
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="text-2xl">❓</span>
        자주 묻는 질문
      </h3>
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <Card key={index} className="p-4 hover:shadow-md transition-shadow">
            <details className="cursor-pointer">
              <summary className="font-semibold text-sm flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-candy-blue rounded">
                <span className="text-candy-blue">Q.</span>
                {faq.q}
              </summary>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 pl-6">
                <span className="text-candy-pink font-semibold">A.</span> {faq.a}
              </p>
            </details>
          </Card>
        ))}
      </div>
    </div>
  )
}
