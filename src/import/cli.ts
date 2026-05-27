import { HvorErDetVannMetadataScraper } from './hvorerdetvann-metadata.js'
import { NokkenNetMetadataScraper } from './nokken-metadata.js'
import { MetadataMerger } from './metadata-merger.js'
import { RiverRegistry } from '../core/river-registry.js'

async function main() {
  console.log('Starting metadata import...')

  console.log('Scraping HvorErDetVann...')
  const hvorScraper = new HvorErDetVannMetadataScraper()
  const hvorResult = await hvorScraper.scrape()
  console.log(`  Found ${hvorResult.length} entries`)

  console.log('Scraping nokken.net...')
  const nokkenScraper = new NokkenNetMetadataScraper()
  const nokkenResult = await nokkenScraper.scrape()
  console.log(`  Found ${nokkenResult.length} entries`)

  console.log('Merging metadata...')
  const merger = new MetadataMerger()
  const merged = await merger.merge([hvorResult, nokkenResult])
  console.log(`  Merged into ${merged.length} unique river entries`)

  const registry = new RiverRegistry()
  await registry.save(merged)
  console.log(`Import complete: ${merged.length} entries written to data/rivers.json`)
}

main().catch((error) => {
  console.error('Import failed:', error)
  process.exit(1)
})
