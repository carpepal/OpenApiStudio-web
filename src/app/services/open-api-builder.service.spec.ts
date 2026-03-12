import { TestBed } from '@angular/core/testing';
import { OpenApiBuilderService } from './open-api-builder.service';
import { OpenApiFormsService } from './open-api-forms.service';

describe('OpenApiBuilderService', () => {
  let builder: OpenApiBuilderService;
  let forms: OpenApiFormsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    forms = TestBed.inject(OpenApiFormsService);
    builder = TestBed.inject(OpenApiBuilderService);
  });

  it('should be created', () => {
    expect(builder).toBeTruthy();
  });

  describe('GET method request body exclusion', () => {
    it('should not include requestBody for GET endpoints', () => {
      forms.pathGroups[0].patchValue({
        path: '/users',
        method: 'get',
        operationId: 'getUsers',
      });
      forms.addRequestBodyContent(0);
      forms.getRequestBodyGroups(0)[0].patchValue({
        mimeType: 'application/json',
        schema: 'User',
      });

      const spec = builder.spec();
      const getOp = spec.paths?.['/users']?.['get'];
      expect(getOp).toBeDefined();
      expect(getOp?.requestBody).toBeUndefined();
    });

    it('should not include requestBody for HEAD endpoints', () => {
      forms.pathGroups[0].patchValue({
        path: '/users',
        method: 'head',
        operationId: 'headUsers',
      });
      forms.addRequestBodyContent(0);
      forms.getRequestBodyGroups(0)[0].patchValue({
        mimeType: 'application/json',
        schema: 'User',
      });

      const spec = builder.spec();
      const headOp = spec.paths?.['/users']?.['head'];
      expect(headOp).toBeDefined();
      expect(headOp?.requestBody).toBeUndefined();
    });

    it('should include requestBody for POST endpoints', () => {
      forms.pathGroups[0].patchValue({
        path: '/users',
        method: 'post',
        operationId: 'createUser',
      });
      forms.addRequestBodyContent(0);
      forms.getRequestBodyGroups(0)[0].patchValue({
        mimeType: 'application/json',
        schema: 'User',
      });

      const spec = builder.spec();
      const postOp = spec.paths?.['/users']?.['post'];
      expect(postOp).toBeDefined();
      expect(postOp?.requestBody).toBeDefined();
    });

    it('should include requestBody for PUT endpoints', () => {
      forms.pathGroups[0].patchValue({
        path: '/users',
        method: 'put',
        operationId: 'updateUser',
      });
      forms.addRequestBodyContent(0);
      forms.getRequestBodyGroups(0)[0].patchValue({
        mimeType: 'application/json',
        schema: 'User',
      });

      const spec = builder.spec();
      const putOp = spec.paths?.['/users']?.['put'];
      expect(putOp).toBeDefined();
      expect(putOp?.requestBody).toBeDefined();
    });
  });
});
