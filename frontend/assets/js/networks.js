/* ═══════════════════════════════════════
   ARYANA CURRENCY — Networks Config
   TRC20, BEP20, ERC20
   ═══════════════════════════════════════ */

const NETWORKS = {
  TRC20: {
    id: 'TRC20',
    label: 'TRC20',
    fullName: 'TRC20 (Tron)',
    color: 'green',
    placeholder: 'T...',
    hint: 'Paste your TRC20 (Tron) wallet address.',
    warning: 'Send only USDT (TRC20) to this address. Sending any other asset or using a different network will result in permanent loss.',
    minDeposit: '10 USDT',
    explorer: 'https://tronscan.org',
    walletField: 'usdt_wallet_trc20',
  },
  BEP20: {
    id: 'BEP20',
    label: 'BEP20',
    fullName: 'BEP20 (BNB Chain)',
    color: 'gold',
    placeholder: '0x...',
    hint: 'Paste your BEP20 (BNB Chain) wallet address.',
    warning: 'Send only USDT (BEP20) to this address. Sending any other asset or using a different network will result in permanent loss.',
    minDeposit: '5 USDT',
    explorer: 'https://bscscan.com',
    walletField: 'usdt_wallet_bep20',
  },
  ERC20: {
    id: 'ERC20',
    label: 'ERC20',
    fullName: 'ERC20 (Ethereum)',
    color: 'blue',
    placeholder: '0x...',
    hint: 'Paste your ERC20 (Ethereum) wallet address.',
    warning: 'Send only USDT (ERC20) to this address. Sending any other asset or using a different network will result in permanent loss.',
    minDeposit: '20 USDT',
    explorer: 'https://etherscan.io',
    walletField: 'usdt_wallet_erc20',
  },
};

const NETWORK_ORDER = ['TRC20', 'BEP20', 'ERC20'];
const DEFAULT_NETWORK = 'TRC20';

/**
 * رندر کردن Network Tabs توی یه container
 * @param {string} containerId - ID عنصر والد
 * @param {function} onChange - کال‌بک وقتی شبکه عوض شد
 * @param {string} initial - شبکه پیش‌فرض
 */
function renderNetworkTabs(containerId, onChange, initial = DEFAULT_NETWORK) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';
  container.className = 'network-tabs';

  NETWORK_ORDER.forEach(id => {
    const net = NETWORKS[id];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'network-tab' + (id === initial ? ' active' : '');
    btn.dataset.network = id;
    btn.textContent = net.label;

    btn.addEventListener('click', () => {
      container.querySelectorAll('.network-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      if (onChange) onChange(id, net);
    });

    container.appendChild(btn);
  });
}

/**
 * گرفتن اطلاعات یه شبکه
 */
function getNetwork(id) {
  return NETWORKS[id] || NETWORKS[DEFAULT_NETWORK];
}