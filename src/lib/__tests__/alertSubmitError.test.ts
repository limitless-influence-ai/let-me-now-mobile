import { alertSubmitErrorMessage } from '../alertSubmitError';

describe('alertSubmitErrorMessage', () => {
  it('[V1.5 #7] 409 limite atteinte -> message clair du backend (pas d\'erreur brute)', () => {
    const err = {
      response: {
        status: 409,
        data: { detail: 'Limite de 10 alertes actives atteinte. Supprimez une alerte…' },
      },
    };
    const msg = alertSubmitErrorMessage(err);
    expect(msg).toContain('10 alertes actives atteinte');
    expect(msg).not.toContain('[object Object]');
  });

  it('409 sans detail -> repli explicite côté client', () => {
    const msg = alertSubmitErrorMessage({ response: { status: 409 } });
    expect(msg).toContain("Limite d'alertes actives atteinte");
    expect(msg).not.toContain('[object Object]');
  });

  it('detail non-string (422 validation array) -> jamais d\'objet rendu', () => {
    const err = { response: { status: 422, data: { detail: [{ loc: ['body'], msg: 'x' }] } } };
    const msg = alertSubmitErrorMessage(err);
    expect(msg).toContain('Données invalides');
    expect(msg).not.toContain('[object Object]');
    expect(msg).not.toContain('loc');
  });

  it('401 -> message session', () => {
    expect(alertSubmitErrorMessage({ response: { status: 401 } })).toContain('Session expirée');
  });

  it('erreur réseau (pas de response) -> message générique sans crash', () => {
    const msg = alertSubmitErrorMessage(new Error('Network Error'));
    expect(msg).toContain('réseau');
    expect(msg).not.toContain('[object Object]');
  });
});
