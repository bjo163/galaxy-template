// MUI Imports
import Typography from '@mui/material/Typography'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'

// Third-party Imports
import classnames from 'classnames'

// Styles Imports
import { db } from '@galaxy/fake-db/pages/frontPages'

import frontCommonStyles from '@views/front-pages/styles.module.css'

// Data Imports

// Data
const faqsData = db.pricing.faqs

const Faqs = () => {
  return (
    <section className={classnames('md:plb-[100px] plb-[50px]', frontCommonStyles.layoutSpacing)}>
      <div className='flex flex-col text-center gap-2 mbe-6'>
        <Typography variant='h4'>FAQ&apos;s</Typography>
        <Typography>Let us help answer the most common questions.</Typography>
      </div>
      <div>
        {faqsData.map((data, index) => {
          return (
            <Accordion key={index} defaultExpanded={data.defaultExpanded}>
              <AccordionSummary aria-controls={data.id + '-content'} id={data.id + '-header'} className='font-medium'>
                <Typography component='span'>{data.question}</Typography>
              </AccordionSummary>
              <AccordionDetails className='text-textSecondary'>{data.answer}</AccordionDetails>
            </Accordion>
          )
        })}
      </div>
    </section>
  )
}

export default Faqs
