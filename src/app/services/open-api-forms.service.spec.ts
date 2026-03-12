import { TestBed } from '@angular/core/testing';
import { OpenApiFormsService } from './open-api-forms.service';

describe('OpenApiFormsService', () => {
  let service: OpenApiFormsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpenApiFormsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isMethodWithoutBody', () => {
    it('should return true for GET', () => {
      expect(service.isMethodWithoutBody('get')).toBeTrue();
    });

    it('should return true for HEAD', () => {
      expect(service.isMethodWithoutBody('head')).toBeTrue();
    });

    it('should return false for POST', () => {
      expect(service.isMethodWithoutBody('post')).toBeFalse();
    });

    it('should return false for PUT', () => {
      expect(service.isMethodWithoutBody('put')).toBeFalse();
    });

    it('should return false for PATCH', () => {
      expect(service.isMethodWithoutBody('patch')).toBeFalse();
    });

    it('should return false for DELETE', () => {
      expect(service.isMethodWithoutBody('delete')).toBeFalse();
    });

    it('should return false for OPTIONS', () => {
      expect(service.isMethodWithoutBody('options')).toBeFalse();
    });
  });

  describe('clearRequestBody', () => {
    it('should remove all request body entries', () => {
      service.addRequestBodyContent(0);
      service.addRequestBodyContent(0);
      expect(service.getRequestBodyGroups(0).length).toBe(2);

      service.clearRequestBody(0);
      expect(service.getRequestBodyGroups(0).length).toBe(0);
    });

    it('should do nothing when request body is already empty', () => {
      expect(service.getRequestBodyGroups(0).length).toBe(0);
      service.clearRequestBody(0);
      expect(service.getRequestBodyGroups(0).length).toBe(0);
    });
  });

  describe('isPathMethodDuplicate', () => {
    it('should return false for a single endpoint', () => {
      service.pathGroups[0].patchValue({ path: '/users', method: 'get' });
      expect(service.isPathMethodDuplicate(0)).toBeFalse();
    });

    it('should return true when two endpoints have the same path and method', () => {
      service.addPath();
      service.pathGroups[0].patchValue({ path: '/users', method: 'get' });
      service.pathGroups[1].patchValue({ path: '/users', method: 'get' });
      expect(service.isPathMethodDuplicate(0)).toBeTrue();
      expect(service.isPathMethodDuplicate(1)).toBeTrue();
    });

    it('should return false when paths are the same but methods differ', () => {
      service.addPath();
      service.pathGroups[0].patchValue({ path: '/users', method: 'get' });
      service.pathGroups[1].patchValue({ path: '/users', method: 'post' });
      expect(service.isPathMethodDuplicate(0)).toBeFalse();
      expect(service.isPathMethodDuplicate(1)).toBeFalse();
    });

    it('should return false when methods are the same but paths differ', () => {
      service.addPath();
      service.pathGroups[0].patchValue({ path: '/users', method: 'get' });
      service.pathGroups[1].patchValue({ path: '/posts', method: 'get' });
      expect(service.isPathMethodDuplicate(0)).toBeFalse();
      expect(service.isPathMethodDuplicate(1)).toBeFalse();
    });

    it('should return false when path is empty', () => {
      service.addPath();
      service.pathGroups[0].patchValue({ path: '', method: 'get' });
      service.pathGroups[1].patchValue({ path: '', method: 'get' });
      expect(service.isPathMethodDuplicate(0)).toBeFalse();
      expect(service.isPathMethodDuplicate(1)).toBeFalse();
    });
  });
});
