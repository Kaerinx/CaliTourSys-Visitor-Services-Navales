const test = require('node:test')
const assert = require('node:assert/strict')

const {
  createInquiryBodySchema,
  createReviewBodySchema,
  reviewListQuerySchema,
} = require('../src/modules/public/public.validators')

const PRODUCT_ID = '11111111-1111-4111-8111-111111111111'

test('review query requires a supported target and UUID', () => {
  assert.deepEqual(
    reviewListQuerySchema.parse({ targetType: 'product', targetId: PRODUCT_ID }),
    { targetType: 'product', targetId: PRODUCT_ID },
  )
  assert.deepEqual(
    reviewListQuerySchema.parse({ targetType: 'tourism_asset', targetId: PRODUCT_ID }),
    { targetType: 'tourism_asset', targetId: PRODUCT_ID },
  )
  assert.throws(() =>
    reviewListQuerySchema.parse({ targetType: 'event', targetId: PRODUCT_ID }),
  )
  assert.throws(() =>
    reviewListQuerySchema.parse({ targetType: 'product', targetId: 'product-slug' }),
  )
})

test('review submission accepts only one-to-five whole stars', () => {
  const valid = createReviewBodySchema.parse({
    targetType: 'business',
    targetId: PRODUCT_ID,
    rating: 5,
    comment: 'Excellent service.',
  })
  assert.equal(valid.rating, 5)

  const validTourismAsset = createReviewBodySchema.parse({
    targetType: 'tourism_asset',
    targetId: PRODUCT_ID,
    rating: 4,
    comment: 'A worthwhile destination to visit.',
  })
  assert.equal(validTourismAsset.targetType, 'tourism_asset')

  for (const rating of [0, 6, 2.5]) {
    assert.throws(() =>
      createReviewBodySchema.parse({
        targetType: 'business',
        targetId: PRODUCT_ID,
        rating,
      }),
    )
  }
})

test('product inquiry accepts a stable product UUID and rejects arbitrary owner fields', () => {
  const valid = createInquiryBodySchema.parse({
    fullName: 'Tourist Example',
    email: 'tourist@example.com',
    subject: 'Product inquiry',
    message: 'Is this product available?',
    sourcePage: '/products/sample-product',
    productId: PRODUCT_ID,
  })
  assert.equal(valid.productId, PRODUCT_ID)

  assert.throws(() =>
    createInquiryBodySchema.parse({
      ...valid,
      ownerId: '22222222-2222-4222-8222-222222222222',
    }),
  )
})
